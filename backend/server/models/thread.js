const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Comment = require('./comment');

const ThreadSchema = new Schema({
    title: { type: String, required: true, maxLength: 128, minLength: 1},
    body: { type: String, required: true, maxLength: 40960, minLength: 1},
    imageUrl: { type: String },
    upvoted: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User'}],
        default: [],
    },
    downvoted: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User'}],
        default: [],
    },
    comments: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Comment'}],
        default: [],
    },
    author: { type: Schema.Types.ObjectId, ref: 'User'},
    box: { type: Schema.Types.ObjectId, ref: 'Box'},
}, {timestamps: true});

ThreadSchema.index({ title: 'text', body: 'text' });

ThreadSchema.post('findOneAndDelete', async (doc, next) => {
    if (doc != null) {
        try {
            await Comment.deleteMany({ _id: { $in: doc.comments } });
            next();
        }
        catch (err) {
            next(err);
        }
    }
});

module.exports = mongoose.model('Thread', ThreadSchema);