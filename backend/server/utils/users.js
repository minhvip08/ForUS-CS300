const User = require("../models/user");
const bcrypt = require("bcrypt");

const tokenGen = require("../../config/jwtToken");

const RESET_PASSWORD_EXPIRY = 15 * 60 * 1000;

// find token from request
const findToken = function (req) {
  console.log("Finding token");
  console.log(req.cookies.token);
  return null;
};

module.exports = {
  findUserById: async function (req, update = false, ignoreBanStatus = false) {
    let data;
    console.log("Finding user by id");
    try {
      data = tokenGen.decodeToken(req.cookies.token);
    } catch (e) {
      console.log(e);
      return null;
    }
    console.log(data);

    if (data == null) return null;
    console.log("Finding user by id");
    let user = await User.findById(data.id);
    // console.log(user);
    if (user == null) {
      console.log("User not found");
      return null;
    } else if (!ignoreBanStatus && user.isBanned) {
      console.log("User is banned");
      return null;
    } else if (data.session == null || user.sessionStart == null) {
      console.log("Session not found");
      return null;
    } else if (data.session != user.sessionStart) {
      console.log("Session mismatch");
      return null;
    } else if (user.lastAccessed == null) {
      console.log("Last accessed not found");
      return null;
    } else if (Date.now() - user.lastAccessed > tokenGen.DEFAULT_DAY_ALIVE) {
      console.log("Last accessed expired");
      return null;
    }

    if (update) await this.updateLastAccessed(user);

    console.log("User found");
    return user;
  },

  // fix bugs add wrong params
  userByIdExists: async function (req) {
    console.log("Checking if user exists");
    if (req.cookies.token) return (await this.findUserById(req)) != null;
    return false;
  },
  findUserByCredentials: async function (username, password) {
    let user = await User.findOne({ username });
    // console.log(user);
    try {
      let match = await bcrypt.compare(password, user.passwordHash);
      console.log(match);
      return match ? user : null;
    } catch (e) {
      return null;
    }
  },
  setPassword: async function (user, password) {
    // generate password hash, with salt 10
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    console.log(user);
    await user.save();
  },
  resetTokenLifespan: async function (user) {
    user.lastAccessed = user.sessionStart = Date.now();
    await user.save();
  },
  getToken: async function (user, skipReset = false, forced = false) {
    if (
      !skipReset &&
      (user.sessionStart == null ||
        user.lastAccessed == null ||
        Date.now() - user.lastAccessed > tokenGen.DEFAULT_DAY_ALIVE)
    ) {
      // user is inactive for too long or this is first time, reset session info
      await this.resetTokenLifespan(user);
    } else await this.updateLastAccessed(user);
    return tokenGen.generateToken(user);
  },
  getPasswordResetToken: async function (user, forceCreate = false) {
    if (
      forceCreate ||
      user.passwordResetExpiry == null ||
      Date.now() - user.passwordResetExpiry > RESET_PASSWORD_EXPIRY
    ) {
      if (forceCreate) {
        await this.createPasswordResetSession(user);
      } else return null;
    }

    return tokenGen.generatePasswordResetToken(user);
  },
  createPasswordResetSession: async function (user) {
    user.passwordResetExpiry = Date.now();
    await user.save();
  },
  findUserWithPasswordTokenRequest: async function (token) {
    let data = tokenGen.decodeToken(token);
    if (data == null || data.id == null) return null;

    let user = await User.findById(data.id);
    if (user == null) return null;

    console.log(user);

    if (
      user.passwordResetExpiry == null ||
      user.passwordResetExpiry != data.session ||
      Date.now() - user.passwordResetExpiry > RESET_PASSWORD_EXPIRY
    ) {
      return null;
    }

    return user;
  },
  updateLastAccessed: async function (user, deferSave = false) {
    user.lastAccessed = Date.now();
    if (!deferSave) await user.save();
  },
};
