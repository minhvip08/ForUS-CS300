const mongoose = require('mongoose');
const userUtil = require('../utils/users');
const Comment = require('../models/comment');
const Thread = require('../models/thread');
const Box = require('../models/box');
const PageLimit = 10;

module.exports = {
    createComment: async (req, res) => {
        let { body, replyTo } = req.body;
        let thread_id = req.params.thread_id;
        let token = req.body.token;
        if (body == null || thread_id == null || token == null) {
            res.status(400).json({ error: "Invalid request." });
        } else {
            const session = await mongoose.startSession();
            try {
                const user = await userUtil.findUserById(req.cookies.token);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                } else {
                    const isBanned = await Box.exists({ _id: thread.box, banned: user._id });
                    if (isBanned) {
                        res.status(403).json({ error: "You are banned." });
                    } else {
                        const comment = new Comment({
                            body: body,
                            author: user._id,
                            thread: thread_id,
                            replyTo: replyTo
                        });
                        session.withTransaction(async () => {
                            await comment.save();
                            await Thread.updateOne(
                                { _id: thread_id },
                                { $push: { comments: comment._id } }
                            );
                            await User.updateOne(
                                { _id: user._id },
                                { $push: { comments: comment._id } }
                            );
                        });
                        res.status(201).json({ message: "Comment created." });
                    }
                }
            } catch (err) {
                res.status(500).json({ error: err });
            } finally {
                session.endSession();
            }
        }
    },
    updateComment: async (req, res) => {
        let { body } = req.body;
        let comment_id = req.params.comment_id;
        let token = req.body.token;
        if (body == null || comment_id == null || token == null) {
            res.status(400).json({ error: "Invalid request." });
        } else {
            try {
                const user = await userUtil.findUserById(req.body.token);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                } else {
                    const comment = await Comment.findOne({ _id: comment_id });
                    if (comment == null) {
                        res.status(404).json({ error: "Comment not found." });
                    } else {
                        const isBanned = await Box.exists({ _id: comment.thread.box, banned: user._id });
                        if (comment.author != user._id || isBanned) {
                            res.status(403).json({ error: "Unauthorized." });
                        } else {
                            comment.body = body;
                            await comment.save();
                            res.status(200).json({ message: "Comment updated." });
                        }
                    }
                }
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }
    },
    deleteComment: async (req, res) => {
        const comment_id = req.params.comment_id;
        if (comment_id == null) {
            res.status(400).json({ error: "Invalid request." });
        } else {
            const session = await mongoose.startSession();
            try {
                const user = await userUtil.findUserById(req.body.token);
                if (user == null) {
                    res.status(403).json({ error: "Invalid session." });
                } else {
                    const comment = await Comment.findOne({ _id: comment_id });
                    if (comment == null) {
                        res.status(404).json({ error: "Comment not found." });
                    } else {
                        const isBanned = await Box.exists({ _id: comment.thread.box, banned: user._id });
                        if ((user.role == 'user' && comment.author != user._id) || isBanned) {
                            res.status(403).json({ error: "Unauthorized." });
                        } else {
                            session.withTransaction(async () => {
                                // Do not use comment.delete() because it does not trigger the post hook.
                                await Comment.findOneAndDelete({ _id: comment_id });
                            });
                            res.status(200).json({ message: "Comment deleted." });
                        }
                    }
                }
            } catch (err) {
                res.status(500).json({ error: err });
            } finally {
                session.endSession();
            }
        }
    },
    upvoteComment: async (req, res) => {
        let comment_id = req.params.comment_id;
        if (comment_id == null) {
            res.status(400).json({ error: "Invalid request." });
        } else {
            const session = await mongoose.startSession();
            try {
                session.withTransaction(async () => {
                    const user = await userUtil.findUserById(req.body.token);
                    const isUpvoted = await Comment.exists({ _id: comment_id, upvoted: user._id });
                    if (isUpvoted) {
                        await Comment.updateOne({ _id: comment_id }, { $pull: { upvoted: user._id } });
                    } else {
                        await Comment.updateOne({ _id: comment_id }, { $pull: { downvoted: user._id } });
                        await Comment.updateOne({ _id: comment_id }, { $push: { upvoted: user._id } });
                    }
                });
            } catch (err) {
                res.status(500).json({ error: err });
            } finally {
                session.endSession();
            }
        }
    },
    downvoteComment: async (req, res) => {
        let comment_id = req.params.comment_id;
        if (comment_id == null) {
            res.status(400).json({ error: "Invalid request." });
        } else {
            const session = await mongoose.startSession();
            try {
                session.withTransaction(async () => {
                    const user = await userUtil.findUserById(req.body.token);
                    const isDownvoted = await Comment.exists({ _id: comment_id, downvoted: user._id });
                    if (isDownvoted) {
                        await Comment.updateOne({ _id: comment_id }, { $pull: { downvoted: user._id } });
                    } else {
                        await Comment.updateOne({ _id: comment_id }, { $pull: { upvoted: user._id } });
                        await Comment.updateOne({ _id: comment_id }, { $push: { downvoted: user._id } });
                    }
                });
            } catch (err) {
                res.status(500).json({ error: err });
            } finally {
                session.endSession();
            }
        }
    }
};