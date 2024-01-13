const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      maxLength: 20,
      minLength: 8,
    },
    passwordHash: { type: String, required: true, maxLength: 64, minLength: 8 },
    fullname: { type: String, required: true, maxLength: 100, minLength: 1 },
    email: { type: String },
    avatarUrl: { type: String },
    description: { type: String, maxLength: 512, minLength: 0 },
    dateOfBirth: { type: Date },
    address: { type: String, maxLength: 512, minLength: 0 },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    threads: {
      type: [{ type: Schema.Types.ObjectId, ref: "Thread" }],
      default: [],
    },
    comments: {
      type: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
      default: [],
    },
    notifications: {
      type: [
        {
          notification: { type: Schema.Types.ObjectId, ref: "Notification" },
          isRead: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    lastAccessed: { type: Number, default: null },
    sessionStart: { type: Number, default: null },
    passwordResetExpiry: { type: Number, default: null },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ username: "text", fullname: "text" });

module.exports = mongoose.model("User", UserSchema);
