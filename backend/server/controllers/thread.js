const mongoose = require('mongoose');
const userUtil = require('../utils/users');
const User = require('../models/user');
const Thread = require('../models/thread');
const Box = require('../models/box');
const sharp = require('sharp');
const { storage } = require('../utils/firebase');
const { ref, uploadString, deleteObject } = require('firebase/storage');
const { v4 } = require('uuid');
const { decode } = require('html-entities');
const sanitizeHtml = require('sanitize-html');

const COMMENTS_PER_PAGE = 10;
const THUMBNAIL_SIZE = 50;

const resizeImage = async (image_data) => {
    let temp = image_data.split(';');
    let type = temp[0].split(':')[1];
    let data = temp[1].split(',')[1];
    let buffer = Buffer.from(data, 'base64');
    let thumbnail_data = await sharp(buffer).resize(null, THUMBNAIL_SIZE).toBuffer();
    return `data:${type};base64,${thumbnail_data.toString('base64')}`;
}

const uploadImage = async (thread_id, image_data, image_id) => {
    if (image_data == null) return;
    console.log("Resizing image...");
    const thumbnail_data = await resizeImage(image_data);
    console.log("Uploading image...");
    const imageRef = ref(storage, `images/thread/${thread_id}/${image_id}`);
    await uploadString(imageRef, image_data, 'data_url');
    console.log("Uploading thumbnail...");
    const thumbnailRef = ref(storage, `images/thread/${thread_id}/${image_id}-thumbnail`);
    await uploadString(thumbnailRef, thumbnail_data, 'data_url');
    console.log("Image uploaded.");
};

// hack to get around the fact that withTransaction does not return the result of the callback
const withTransactionForResult = async (session, callback) => {
    let result;
    await session.withTransaction(async () => {
        result = await callback();
        return result;
    });
    return result;
}

const deleteImage = async (thread_id, image_id) => {
    try {
        const imageRef = ref(storage, `images/thread/${thread_id}/${image_id}`);
        await deleteObject(imageRef);
        const thumbnailRef = ref(storage, `images/thread/${thread_id}/${image_id}-thumbnail`);
        await deleteObject(thumbnailRef);
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = {
    createThread: async (req, res) => {
        let { title, body } = req.body;
        body = sanitizeHtml(body, { allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]) });
        let imgCount = body.split('&lt;img').length - 1;
        let box_id = req.params.box_id;
        if (box_id == null || !Boolean(title) || !Boolean(body)) {
            res.status(400).json({ error: "Invalid request.", code: 0 });
        }
        else if (imgCount > 1) {
            res.status(400).json({ error: "Invalid request.", code: 1 });
        }
        else {
            const session = await mongoose.startSession();
            try {
                const user = await userUtil.findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else {
                    const isBanned = await Box.exists({ _id: box_id, banned: user._id });
                    if (isBanned) {
                        res.status(403).json({ error: "You are banned." });
                    }
                    else {
                        console.log("Creating thread...");
                        let thread;
                        if (imgCount === 1) {
                            const image_data = body.match(/(?<=src=")([^"]+)(?=")/g)[0];
                            if (!Boolean(image_data)) {
                                res.status(400).json({ error: "Invalid request.", code: 2 });
                                return;
                            }
                            else if (image_data.startsWith('http')) {
                                thread = new Thread({
                                    title: title,
                                    body: body,
                                    imageUrl: decode(image_data),
                                    author: user._id,
                                    box: box_id
                                });
                            }
                            else if (image_data.includes('data:image')) {
                                const image_id = v4();
                                thread = new Thread({
                                    title: title,
                                    body: body,
                                    imageUrl: image_id,
                                    author: user._id,
                                    box: box_id
                                });
                                await uploadImage(thread._id.toString(), image_data, image_id);
                                thread.body = thread.body.replace(/(?<=src=")([^"]+)(?=")/g, image_id);
                            }
                        }
                        else {
                            thread = new Thread({
                                title: title,
                                body: body,
                                author: user._id,
                                box: box_id
                            });
                        }
                        console.log("Saving thread...");
                        await session.withTransaction(async () => {
                            await thread.save();
                            await Box.updateOne(
                                { _id: box_id },
                                { $push: { threads: thread._id } }
                            );
                            await User.updateOne(
                                { _id: user._id },
                                { $push: { threads: thread._id } }
                            );
                        });
                        res.status(201).json({ message: "Thread created.", thread_id: thread._id });
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
            finally {
                session.endSession();
            }
        }
    },
    readThread: async (req, res) => {
        let thread_id = req.params.thread_id;
        let page = req.params.page;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            if (page == null) {
                page = 1;
            }
            else {
                page = parseInt(page);
            }
            try {
                const user = await userUtil.findUserById(req);
                const thread = await Thread.aggregate([
                    { $match: { _id: new mongoose.Types.ObjectId(thread_id)}},
                    {
                        $lookup: {
                            from: 'users',
                            let: { "id": user._id },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                                { $project: { _id: 1, fullname: 1, avatarUrl: 1 } }
                            ],
                            as: "currentUser"
                        }
                    },
                    {                    
                        $lookup: {
                            from: 'comments',
                            localField: '_id',
                            foreignField: 'thread',
                            as: 'comments'
                        }
                    },
                    {
                        $unwind: {
                            path: "$comments",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            let: { "id": "$comments.author" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                                { $project: { _id: 1, fullname: 1, avatarUrl: 1 } }
                            ],
                            as: "comments.author",
                        },
                    },
                    {
                        $unwind: {
                            path: "$comments.author",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'comments',
                            let: { "replyTo": "$comments.replyTo" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$_id", "$$replyTo"] } } },
                                {
                                    $lookup: {
                                        from: "users",
                                        let: { "id": "$author" },
                                        pipeline: [
                                            { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                                            { $project: { _id: 1, fullname: 1 } }
                                        ],
                                        as: "author"
                                    }
                                },
                                {
                                    $unwind: {
                                        path: "$author",
                                        preserveNullAndEmptyArrays: true
                                    }
                                }
                            ],
                            as: 'comments.replyTo'
                        }
                    },
                    {
                        $unwind: {
                            path: "$comments.replyTo",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            let: { "id": "$author" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                                { $project: { _id: 1, fullname: 1, avatarUrl: 1 } }
                            ],
                            as: "author",
                        },
                    },    
                    {
                        $group: {
                            _id: '$_id',
                            currentUser: { $first: '$currentUser' },
                            title: { $first: '$title' },
                            body: { $first: '$body' },
                            author: { $first: '$author' },
                            createdAt: { $first: '$createdAt' },
                            updatedAt: { $first: '$updatedAt' },
                            upvoted: { $first: '$upvoted' },
                            downvoted: { $first: '$downvoted' },
                            voteStatus: { $first: '$voteStatus' },
                            comments: { 
                                $push: {
                                    $cond: {
                                        if: { $ne: ['$comments', {}] },
                                        then: {
                                            _id: '$comments._id',
                                            author: '$comments.author',
                                            body: '$comments.body',
                                            createdAt: '$comments.createdAt',
                                            updatedAt: '$comments.updatedAt',
                                            replyTo: {
                                                $cond: {
                                                    if: { $ne: ['$comments.replyTo', {}] },
                                                    then: '$comments.replyTo',
                                                    else: '$$REMOVE'
                                                }
                                            },
                                            score: {
                                                $subtract: [
                                                    { $size: '$comments.upvoted' },
                                                    { $size: '$comments.downvoted' }
                                                ]
                                            },
                                            voteStatus: {
                                                $cond: {
                                                    if: { $in: [user._id, '$comments.upvoted'] },
                                                    then: 1,
                                                    else: {
                                                        $cond: {
                                                            if: { $in: [user._id, '$comments.downvoted'] },
                                                            then: -1,
                                                            else: 0
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        else: '$$REMOVE'
                                    }
                                }
                            },
                        }
                    },              
                    {
                        $addFields: {
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            score: {
                                $subtract: [
                                    { $size: '$upvoted' },
                                    { $size: '$downvoted'}
                                ]
                            },
                            voteStatus: {
                                $cond: {
                                    if: { $in: [user._id, '$upvoted'] },
                                    then: 1,
                                    else: {
                                        $cond: {
                                            if: { $in: [user._id, '$downvoted'] },
                                            then: -1,
                                            else: 0
                                        }
                                    }
                                }
                            },
                            pageCount: {
                                $ceil: {
                                    $divide: [
                                        { $size: '$comments' },
                                        COMMENTS_PER_PAGE
                                    ]
                                }
                            },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            currentUser: { $arrayElemAt: ['$currentUser', 0] },
                            title: 1,
                            author: { $arrayElemAt: ['$author', 0] },
                            body: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            score: 1,
                            voteStatus: 1,
                            pageCount: 1,
                            Author: 1,  
                            comments: {
                                $slice: [
                                    {
                                        $sortArray: {
                                            input: "$comments",
                                            sortBy: { createdAt: 1}
                                        }
                                    },
                                    (page - 1) * COMMENTS_PER_PAGE,
                                    COMMENTS_PER_PAGE
                                ],
                            },
                        }
                    }
                ]).exec();
                thread[0].body = thread[0].body.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
                if (String(user._id) === String(thread[0].author._id)) {
                    thread[0].isUpdater = 1;
                    thread[0].isDeleter = 1;
                }
                else {
                    if(user.role == 'admin') {
                        thread[0].isUpdater = 0;
                        thread[0].isDeleter = 1;
                    }
                    else {
                        thread[0].isUpdater = 0;
                        thread[0].isDeleter = 0;
                    }
                }
                if (thread[0].pageCount === 0) {
                    thread[0].pageCount = 1;
                    res.status(200).json({ thread: thread[0] });
                }
                else if (thread[0].pageCount < page) {
                    res.status(404).json({ error: "Page not found." });
                }
                else {
                    for (let i = 0; i < thread[0].comments.length; i++) {
                        thread[0].comments[i].body = thread[0].comments[i].body.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
                        if (thread[0].comments[i].replyTo) {
                            thread[0].comments[i].replyTo.body = thread[0].comments[i].replyTo.body.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
                        }
                        if (String(user._id) === String(thread[0].comments[i].author._id)) {
                            thread[0].comments[i].isUpdater = 1;
                            thread[0].comments[i].isDeleter = 1;
                        }
                        else {
                            if(user.role == 'admin') {
                                thread[0].comments[i].isUpdater = 0;
                                thread[0].comments[i].isDeleter = 1;
                            }
                            else {
                                thread[0].comments[i].isUpdater = 0;
                                thread[0].comments[i].isDeleter = 0;
                            }
                        }
                    }
                    res.status(200).json({ thread: thread[0] });
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    updateThread: async (req, res) => {
        let { title, body } = req.body;
        let thread_id = req.params.thread_id;
        let token = req.body.token;
        if (title == null || body == null || thread_id == null || token == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await userUtil.findUserById(req.body.token);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else {
                    const thread = await Thread.findOne({ _id: thread_id });
                    if (thread == null) {
                        res.status(404).json({ error: "Thread not found." });
                    }
                    else {
                        
                        res.status(200).json({ message: "Thread updated." });
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    deleteThread: async (req, res) => {
        const thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            const session = await mongoose.startSession();
            try {
                const result = await withTransactionForResult(session, async () => {
                    const thread = await Thread.findOneAndDelete({ _id: thread_id });
                    await Box.updateOne({ _id: thread.box }, { $pull: { threads: thread._id } });
                    await User.updateOne({ _id: thread.author }, { $pull: { threads: thread._id } });
                    return thread;
                });
                if (result.imageUrl && !result.imageUrl.startsWith('http')) {
                    await deleteImage(thread_id, result.imageUrl);
                }
                res.status(200).json({ message: "Thread deleted." });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
            finally {
                session.endSession();
            }
        }
    },
    upvoteThread: async (req, res) => {
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            const session = await mongoose.startSession();
            try {
                const user = await userUtil.findUserById(req);
                const isUpvoted = await Thread.exists({ _id: thread_id, upvoted: user._id });
                let voteStatus = isUpvoted ? 0 : 1;
                await session.withTransaction(async () => {
                    if (isUpvoted) {
                        await Thread.updateOne({ _id: thread_id }, { $pull: { upvoted: user._id } });
                    }
                    else {
                        await Thread.updateOne({ _id: thread_id }, { $pull: { downvoted: user._id } });
                        await Thread.updateOne({ _id: thread_id }, { $push: { upvoted: user._id } });
                    }
                });
                res.status(200).json({ message: "Thread upvoted.",  voteStatus: voteStatus });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
            finally {
                session.endSession();
            }
        }
    },
    downvoteThread: async (req, res) => {
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            const session = await mongoose.startSession();
            try {
                const user = await userUtil.findUserById(req);
                const isDownvoted = await Thread.exists({ _id: thread_id, downvoted: user._id });
                let voteStatus = isDownvoted ? 0 : -1;
                await session.withTransaction(async () => {    
                    if (isDownvoted) {
                        await Thread.updateOne({ _id: thread_id }, { $pull: { downvoted: user._id } });
                    }
                    else {
                        await Thread.updateOne({ _id: thread_id }, { $pull: { upvoted: user._id } });
                        await Thread.updateOne({ _id: thread_id }, { $push: { downvoted: user._id } });
                    }
                });
                res.status(200).json({ message: "Thread downvoted.", voteStatus: voteStatus });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
            finally {
                session.endSession();
            }
        }
    },
    isDeleter:
    /**
    * Internal middleware to check if the user is the author of the thread or a moderator of the box.
    * 
    * @param {string} thread_id the id of the thread.
    * @throws {400} - Invalid request.
    * @throws {403} - Invalid session.
    * @throws {403} - Unauthorized.
    * @throws {404} - Thread not found.
    * @throws {500} - Internal server error.
    */
    async (req, res, next) => {    
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await userUtil.findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else if (user.role === 'admin') {
                    next();
                }
                else {
                    const thread = await Thread.findOne({ _id: thread_id }).populate('box', 'moderators bannedUsers');
                    console.log(thread);
                    if (thread == null) {
                        res.status(404).json({ error: "Thread not found." });
                    }
                    else {
                        if (thread.box.moderators.includes(user._id) || (thread.author.equals(user._id) && !thread.box.bannedUsers.includes(user._id))) {
                            next();
                        }
                        else {
                            res.status(403).json({ error: "Unauthorized." });
                        }
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    getDeleterStatus:
    /**
    * Endpoint to check if the user is the author of the thread or a moderator of the box.
    * @param {string} thread_id the id of the thread.
    * @throws {400} - Invalid request.
    * @throws {403} - Invalid session.
    * @throws {404} - Thread not found.
    * @throws {500} - Internal server error.
    */
    async (req, res) => {
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await userUtil.findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else if (user.role === 'admin') {
                    res.status(200).json({ deleterStatus: 'admin' });
                }
                else {
                    const thread = await Thread.findOne({ _id: thread_id }).populate('box', 'moderators');
                    if (thread == null) {
                        res.status(404).json({ error: "Thread not found." });
                    }
                    else {
                        if (thread.box.moderators.includes(user._id)) {
                            res.status(200).json({ deleterStatus: 'moderator' });
                        }
                        else if (thread.author.equals(user._id) && !thread.box.banned.includes(user._id)) {
                            res.status(200).json({ deleterStatus: 'author' });
                        }
                        else {
                            res.status(200).json({ deleterStatus: 'user' });
                        }
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    isUpdater:
    /**
     * Internal middleware to check if the user is the author of the thread.
     * @param {string} thread_id the id of the thread.
     * @throws {400} - Invalid request.
     * @throws {403} - Invalid session.
     * @throws {403} - Unauthorized.
     * @throws {404} - Thread not found.
     * @throws {500} - Internal server error.
     */
    async (req, res, next) => {
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await userUtil.findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else {
                    const thread = await Thread.findOne({ _id: thread_id }.populate('box', 'bannedUsers'));
                    if (thread == null) {
                        res.status(404).json({ error: "Thread not found." });
                    }
                    else {
                        if (thread.author.equals(user._id) && !thread.box.bannedUsers.includes(user._id)) {
                            next();
                        }
                        else {
                            res.status(403).json({ error: "Unauthorized." });
                        }
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    getUpdaterStatus:
    /**
     * Endpoint to check if the user is the author of the thread.
     * @param {string} thread_id the id of the thread.
     * @throws {400} - Invalid request.
     * @throws {403} - Invalid session.
     * @throws {404} - Thread not found.
     * @throws {500} - Internal server error.
    */
    async (req, res) => {
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await userUtil.findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else {
                    const thread = await Thread.findOne({ _id: thread_id });
                    if (thread == null) {
                        res.status(404).json({ error: "Thread not found." });
                    }
                    else {
                        if (thread.author.equals(user._id)) {
                            res.status(200).json({ updaterStatus: 'author' });
                        }
                        else {
                            res.status(200).json({ updaterStatus: 'user' });
                        }
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    isBanned:
    /**
     * Internal middleware to check if the user is banned from the box of the thread.
     * @param {string} thread_id the id of the thread.
     * @throws {400} - Invalid request.
     * @throws {403} - Invalid session.
     * @throws {403} - Unauthorized.
     * @throws {404} - Thread not found.
     * @throws {500} - Internal server error.
     */
    async (req, res, next) => {
        let thread_id = req.params.thread_id;
        if (thread_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await userUtil.findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else {
                    const thread = await Thread.findOne({ _id: thread_id }).populate('box', 'banned');
                    if (thread == null) {
                        res.status(404).json({ error: "Thread not found." });
                    }
                    else {
                        if (thread.box.banned.includes(user._id)) {
                            res.status(403).json({ error: "Unauthorized." });
                        }
                        else {
                            next();
                        }
                    }
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    }
}