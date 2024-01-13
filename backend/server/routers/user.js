const express = require("express");
const {
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
  // getCommentHistory,
} = require("../controllers/user");

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/register", registerUser);
router.get("/info", infoUser);
router.get("/all-info", getAllUsers);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);
router.put("/update-profile", updateProfile);
router.get("/is-admin", isAdmin, privilegeConfirmation);
router.put("/update-password", updatePassword);
router.get("/allUser", getAllUsers);
router.get("/notification", getNotification);
router.get("/thread-history", getThreadHistory);
router.get("/:id", userProfile);
router.put("/notification", updateAllNotificationIsRead);
router.put("/notification/:notification_id", updateNotificationStatus);
// router.put("/comment-history", getCommentHistory);
router.post("/ban", banUser, setBanStatus);
router.post("/unban", unbanUser, setBanStatus);

module.exports = router;
