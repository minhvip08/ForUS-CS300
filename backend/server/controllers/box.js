const mongoose = require('mongoose');
const Box = require('../models/box');
const Group = require('../models/group');
const { findUserById } = require('../utils/users');
const THREADS_PER_PAGE = 1;

module.exports = {
    createBox: async (req, res) => {
        let group_id = req.params.group_id;
        let { name, description } = req.body;
        if (group_id == null || name == null || description == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            let box = new Box({ name: name, description: description });
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    await box.save({ session: session });
                    await Group.updateOne({ _id: group_id }, { $push: { boxes: box._id } }, {session: session });
                });
                let jsonBox = box.toJSON();
                jsonBox.threadCount = 0;
                res.status(200).json({ message: "Box created.", box: jsonBox});
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
            finally {
                session.endSession();
            }
        }
    },
    readBox: async (req, res) => {
        let box_id = req.params.box_id;
        let page = req.params.page;
        if (box_id == null) {
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
                const user = await findUserById(req);
                const box = await Box.aggregate([
                    { $match: { _id: new mongoose.Types.ObjectId(box_id) } },
                    {
                        $lookup: {
                            from: "threads",
                            localField: "threads",
                            foreignField: "_id",
                            as: "threads",
                        },
                    },
                    { 
                        $unwind: {
                            path: "$threads",
                            preserveNullAndEmptyArrays: true,
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            let: { "id": "$threads.author" },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                                { $project: { fullname: 1 } }
                            ],
                            as: "threads.author",
                        },
                    },
                    {
                        $unwind: {
                            path: "$threads.author",
                            preserveNullAndEmptyArrays: true,
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            name: { $first: "$name" },
                            description: { $first: "$description" },
                            threads: { 
                                $push: {
                                    $cond: {
                                        if: { $isArray: "$threads.comments" },
                                        then: {
                                            _id: "$threads._id",
                                            title: "$threads.title",
                                            author: "$threads.author",
                                            score: {
                                                $subtract: [
                                                    { $size: "$threads.upvoted" },
                                                    { $size: "$threads.downvoted" }
                                                ]
                                            },
                                            commentCount: { $size: "$threads.comments" },
                                            voteStatus: {
                                                $cond: {
                                                    if: { $in: [user._id, "$threads.upvoted"] },
                                                    then: 1,
                                                    else: {
                                                        $cond: {
                                                            if: { $in: [user._id, "$threads.downvoted"] },
                                                            then: -1,
                                                            else: 0
                                                        }
                                                    }
                                                }
                                            },
                                            createdAt: "$threads.createdAt",
                                            updatedAt: "$threads.updatedAt"
                                        },
                                        else: "$$REMOVE"
                                    }
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            pageCount: {
                                $ceil: {
                                    $divide: [
                                        { $size: "$threads" },
                                        THREADS_PER_PAGE
                                    ]
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            description: 1,
                            pageCount: 1,
                            threads: {
                                $slice: [
                                    {
                                        $sortArray: {
                                            input: "$threads",
                                            sortBy: { updatedAt: -1}
                                        }
                                    },
                                    (page - 1) * THREADS_PER_PAGE,
                                    THREADS_PER_PAGE
                                ],
                            }
                        }
                    }
                ]).exec();
                if (box[0].pageCount < page) {
                    res.status(404).json({ error: "Page not found." });
                }
                else {
                    res.status(200).json({ box: box[0] });
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    renameBox: async (req, res) => {
        let box_id = req.params.box_id;
        let { name } = req.body;
        if (box_id == null || name == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                await Box.updateOne({ _id: box_id }, { name: name });
                res.status(200).json({ message: "Box renamed." });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    updateBoxDescription: async (req, res) => {
        let box_id = req.params.box_id;
        let { description } = req.body;
        if (box_id == null || description == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                await Box.updateOne({ _id: box_id }, { description: description });
                res.status(200).json({ message: "Box description updated." });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    deleteBox: async (req, res) => {
        let box_id = req.params.box_id;
        if (box_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    await Box.findOneAndDelete({ _id: box_id }, { session: session });
                });
                res.status(200).json({ message: "Box deleted." });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
            finally {
                session.endSession();
            }
        }
    },
    isModerator: async (req, res, next) => {
        let box_id = req.params.box_id;
        if (box_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                const user = await findUserById(req);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                }
                else if (user.role === "admin") {
                    next();
                }
                else {
                    const box = await Box.findOne({ _id: box_id, moderators: user._id });
                    if (box == null) {
                        res.status(403).json({ error: "You are not a moderator of this box." });
                    }
                    else {
                        next();
                    }
                
                }
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    addModerator: async (req, res) => {
        let box_id = req.params.box_id;
        let { user_id } = req.body;
        if (box_id == null || user_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                await Box.updateOne({ _id: box_id }, { $push: { moderators: user_id } });
                res.status(200).json({ message: "Moderator added." });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    removeModerator: async (req, res) => {
        let box_id = req.params.box_id;
        let { user_id } = req.body;
        if (box_id == null || user_id == null) {
            res.status(400).json({ error: "Invalid request." });
        }
        else {
            try {
                await Box.updateOne({ _id: box_id }, { $pull: { moderators: user_id } });
                res.status(200).json({ message: "Moderator removed." });
            }
            catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
}