const userUtil = require("../utils/users");
const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const Notification = require("../models/notification");
const Thread = require("../models/thread");
const Comment = require("../models/comment");
const user = require("../models/user");
const mongoose = require("mongoose");
const ERROR = require("./error");

const loginUser = async (req, res, next) => {
  try {
    let { username, password } = req.body;

    // check if user exists
    if (username == null || password == null)
      return res.status(403).json({ error: "Missing username or password." });

    if (await userUtil.userByIdExists(req))
      return res.status(403).json({ error: "Already logged in." });

    const user = await userUtil.findUserByCredentials(username, password);
    if (user == null)
      return res.status(403).json({ error: "Invalid username or password." });
    if (user.isBanned)
      return res.status(403).json({ error: "You are banned." });
    const token = await userUtil.getToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
    });
    res.status(200).json({
      message: "Login successfully.",
      token: token,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const logoutUser = async (req, res, next) => {
  try {
    let user = await userUtil.findUserById(req);
    console.log(user);

    if (user == null) res.status(200).json({ message: "Invalid session" });
    else {
      user.sessionStart = null;
      user.lastAccessed = null;
      await user.save();
      res.clearCookie("token", {
        httpOnly: true,
        secure: false,
      });
      res.status(200).json({ message: "Logout successfully." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const registerUser = async (req, res, next) => {
  try {
    const user = await userUtil.findUserById(req);
    if (user.role != "admin")
      res
        .status(403)
        .json({ error: "Access denied because you are not admin." });
    else {
      let { username, fullname, email, dateOfBirth, address, role } = req.body;
      if (
        username == null ||
        fullname == null ||
        email == null ||
        address == null ||
        role == null ||
        dateOfBirth == null
      )
        return res.status(403).json({ error: "Missing required fields." });
      const password = dateOfBirth.split("-").join("");

      let exists = await userModel.findOne({ username });
      if (exists != null)
        return res.status(403).json({ error: "User already exists." });

      let newUser = new userModel();
      newUser.username = username;
      newUser.fullname = fullname;
      newUser.address = address;
      newUser.email = email;
      newUser.dateOfBirth = dateOfBirth;
      newUser.role = role.toLowerCase();

      await userUtil.setPassword(newUser, password);

      res.status(200).json({
        message: "User created successfully.",
        access_token: await userUtil.getToken(newUser),
        username,
        fullname,
        password,
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const infoUser = async (req, res, next) => {
  try {
    let user = await userUtil.findUserById(req);
    console.log("infoUser");
    // const usertemp = await userModel.aggregate(
    //   [{
    //     $match: { _id: user._id },
    //     $project: {
    //       username: 1,
    //       fullname: 1,
    //       email: 1,
    //       address: 1,
    //       avatarUrl: 1,
    //       description: 1,
    //       role: 1,
    //       dateOfBirth: 1
    //     }
    //   }])

    user = await userModel
      .findOne({ _id: user._id })
      .select(
        "-passwordHash -passwordResetExpiry -passwordResetToken -sessionStart -lastAccessed"
      );

    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      res.status(200).json({
        message: "User info.",
        user: user,
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Show user profile by id
const userProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("Userid", id);

    const user = await userModel
      .findOne({ _id: new mongoose.Types.ObjectId(id) })
      .select(
        "-passwordHash -passwordResetExpiry -passwordResetToken -sessionStart -lastAccessed -notifications"
      );

    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      res.status(200).json({
        message: "User info.",
        user: user,
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Forgot password and reset password
const forgotPassword = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (username == null)
      return res.status(403).json({ error: "Missing username." });

    if ((await userUtil.findUserById(req)) != null)
      return res.status(403).json({ error: "Already logged in." });

    const user = await userModel.findOne({ username });
    if (user == null)
      return res.status(403).json({ error: "Invalid username." });

    // Send email to user
    const resetPasswordToken = await userUtil.getPasswordResetToken(user, true);
    console.log("token reset", resetPasswordToken);
    const html = `<h1>Forgot password request</h1>
  <p>Click <a target="_blank" href="http://localhost:3000/login/reset-password/${resetPasswordToken}">here</a> to reset your password.</p>
  <p>If you didn't make this request, please ignore this message.</p>`;

    const info = await sendEmail({ email: user.email, html });
    // console.log(info);
    res.status(200).json({
      success: info.response?.includes("OK") ? true : false,
      mes: info.response?.includes("OK")
        ? "Email sent successfully"
        : "Something went wrong",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { passwordResetToken, newPassword, confirmNewPassword } = req.body;
    console.log(
      "resetPassword",
      passwordResetToken,
      newPassword,
      confirmNewPassword
    );

    if (newPassword != confirmNewPassword)
      return res.status(403).json({
        code: "PASSWORD_MISMATCH",
        message: "Password and password retype doesn't match",
      });

    let user = await userUtil.findUserWithPasswordTokenRequest(
      passwordResetToken
    );

    if (user == null)
      return res.status(403).json({
        code: "INVALID_REQUEST_TOKEN",
        message: "Password reset token is expired or invalid",
      });

    user.passwordResetExpiry = null;
    await userUtil.resetTokenLifespan(user);
    await userUtil.setPassword(user, newPassword);

    res.status(200).json({
      code: "SUCCESS",
      message: "Password reset successfully",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// The updatePassword function is used to update password when user is logged in
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (newPassword != confirmNewPassword)
      return res.status(403).json({
        code: "PASSWORD_MISMATCH",
        message: "Password and password retype doesn't match",
      });

    let user = await userUtil.findUserById(req);

    if (user == null)
      return res.status(403).json({
        code: "INVALID_SESSION",
        message: "Invalid session",
      });

    let match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match)
      return res.status(403).json({
        code: "WRONG_PASSWORD",
        message: "Wrong password",
      });

    await userUtil.setPassword(user, newPassword);

    res.status(200).json({
      code: "SUCCESS",
      message: "Password updated successfully",
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await userUtil.findUserById(req);
    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      if (user.role === "admin") next();
      else res.status(403).json({ error: "Access denied." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const privilegeConfirmation = async (req, res) => {
  res.status(200).json({ message: "Access granted." });
};

const updateProfile = async (req, res, next) => {
  try {
    console.log("updateProfile");
    const user = await userUtil.findUserById(req);
    console.log(user);
    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      console.log(req.body);
      const { fullname, email, avatarUrl, description, address } = req.body;

      if (!!fullname) user.fullname = fullname;
      if (!!email) user.email = email;
      if (!!description) user.description = description;
      if (!!address) user.address = address;
      if (!!avatarUrl) user.avatarUrl = avatarUrl;
      // throw error if not save user
      await user.save();

      // console.log(user);
      console.log("updateProfile");
      res.status(200).json({ message: "Update profile successfully." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getNotification = async (req, res, next) => {
  try {
    const user = await userUtil.findUserById(req);
    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      const notificationIds = user.notifications.map(
        (notification) => notification.notification
      );
      // console.log(notificationIds);
      const notifications = await Notification.find({
        _id: { $in: notificationIds },
      });

      notifications.sort((a, b) => b.createdAt - a.createdAt);

      // filter notifications have thread or comment deleted
      for (let i = 0; i < notifications.length; i++) {
        const thread = await Thread.findOne({ _id: notifications[i].thread });
        const comment = await Comment.findOne({
          _id: notifications[i].comment,
        });
        console.log("thread", thread);
        if (notifications[i].from == "thread" && thread == null) {
          // delete notifications[i];

          await user.updateOne({
            $pull: { notifications: { notification: notifications[i]._id } },
          });

          notifications.splice(i, 1);

          // await user.updateOne({ $pull: { notifications: { notification: notifications[i]._id } } });
          i--;
        } else if (notifications[i].from == "reply" && comment == null) {
          // delete notifications[i];
          await user.updateOne({
            $pull: { notifications: { notification: notifications[i]._id } },
          });

          notifications.splice(i, 1);
          i--;
        }
      }

      // await user.save();

      res.status(200).json({
        message: "Get all notifications successfully.",
        notifications: notifications,
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const user = await userUtil.findUserById(req);
    if (user == null || user.role != "admin")
      res.status(403).json({ error: "Not permitted." });
    else {
      let result = await userModel.find({});

      const getableFields = [
        "_id",
        "username",
        "fullname",
        "email",
        "lastAccessed",
        "avatarUrl",
        "role",
        "isBanned",
      ];

      result = result.map((e) => {
        let x = {};
        for (let i of getableFields) x[i] = e[i];
        return x;
      });

      res.status(200).send({ message: "Fetched successfully", users: result });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateAllNotificationIsRead = async (req, res, next) => {
  try {
    const user = await userUtil.findUserById(req);
    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      user.notifications.map((notification) => {
        notification.isRead = true;
      });
      await user.save();

      res
        .status(200)
        .json({ message: "Update all notifications successfully." });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateNotificationStatus = async (req, res, next) => {
  try {
    const user = await userUtil.findUserById(req);
    if (user == null) res.status(403).json({ error: "Invalid session." });
    else {
      const { notification_id } = req.params;
      const notification = await Notification.findOne({ _id: notification_id });
      if (notification == null)
        res.status(403).json({ error: "Invalid notification id." });
      else {
        const userNotification = user.notifications.find(
          (e) => e.notification.toString() == notification_id.toString()
        );
        if (userNotification == null)
          res.status(403).json({ error: "Invalid notification id." });
        else {
          userNotification.isRead = true;
          await user.save();
          res
            .status(200)
            .json({ message: "Update notification status successfully." });
        }
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getThreadHistory = async (req, res) => {
  let user_id = req.query.user_id;
  console.log(user_id);
  // let page = req.query.page;
  // let order = req.query.order;
  // let direction = req.query.direction;
  if (user_id == null) {
    res.status(400).json({ error: ERROR.INVALID_REQUEST });
  } else {
    const _user = await user.findById(user_id);
    if (_user == null) return res.status(404).json({ error: ERROR.NOT_FOUND });
    // if (page == null) {
    //   page = 1;
    // } else {
    //   page = parseInt(page);
    // }
    // console.log(order, direction);
    // if (!Boolean(order)) {
    //   order = "updatedAt";
    // }
    // if (
    //   order !== "createdAt" &&
    //   order !== "updatedAt" &&
    //   order !== "score" &&
    //   order !== "commentCount" &&
    //   order !== "title"
    // ) {
    //   res.status(400).json({ error: ERROR.INVALID_REQUEST });
    //   return;
    // }
    // if (!Boolean(direction)) {
    //   direction = "desc";
    // }
    // if (direction !== "asc" && direction !== "desc") {
    //   res.status(400).json({ error: ERROR.INVALID_REQUEST });
    //   return;
    // }
    // if (direction === "asc") {
    //   direction = 1;
    // } else if (direction === "desc") {
    //   direction = -1;
    // }
    try {
      let data = [];
      for (let thread of _user.threads) {
        let t = await Thread.findById(thread);
        if (t) data.push(t);
      }
      res.status(200).json({ threadHistory: data });
    } catch (err) {
      res
        .status(500)
        .json({ a: err.message, error: ERROR.INTERNAL_SERVER_ERROR });
    }
  }
};

const setBanStatus = async function (req, res, next) {
  let ban = !!req.params.ban;
  try {
    const user = await userUtil.findUserById(req);
    if (user == null || user.role != "admin")
      res.status(403).json({ error: "Not permitted." });
    else {
      let user_id = req.body.user_id,
        target;
      if (
        user_id == null ||
        (target = await userModel.findById(user_id)) == null
      )
        return res.status(403).json({ message: ERROR.USER_NOT_FOUND });
      if (target._id == user._id) return res.status(403).json({ message: "You wanna ban yourself??" });
      if (target.role == "admin") return res.status(403).json({ message: "Cannot ban admins."});
      target.isBanned = ban;
      await target.save();
      res.status(200).json({ message: "Action completed.", status: ban });
    }
  } catch (e) {
    res.status(500).json({ message: ERROR.INTERNAL_SERVER_ERROR });
  }
};

const banUser = function (req, res, next) {
  req.params.ban = true;
  next();
};

const unbanUser = function (req, res, next) {
  req.params.ban = false;
  next();
};

module.exports = {
  loginUser,
  logoutUser,
  registerUser,
  infoUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  isAdmin,
  privilegeConfirmation,
  updatePassword,
  getAllUsers,
  getNotification,
  userProfile,
  updateAllNotificationIsRead,
  updateNotificationStatus,
  getThreadHistory,
  setBanStatus,
  banUser,
  unbanUser,
};
