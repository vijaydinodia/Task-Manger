const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");

const {
  signUp,
  createUserByAdmin,
  login,
  forget,
  verifyOtp,
  resetForgotPassword,
  resetPassword,
  editProfile,
  userStatus,
  getAllUsers,
  deleteUser,
  getTaskUsers,
} = require("../controller/userController");

// public routes
router.post("/signup", signUp);
router.post("/login", login);
router.post("/forget", forget);
router.post("/verifyOtp", verifyOtp);
router.patch("/reset-forgot-password", resetForgotPassword);

// protected routes
router.patch("/resetPassword", auth, resetPassword);
router.patch("/editProfile", auth, editProfile);
router.get("/task-users", auth, getTaskUsers);
router.patch("/userStatus", auth, isAdmin, userStatus);
router.post("/admin-create", auth, isAdmin, createUserByAdmin);
router.get("/all", auth, isAdmin, getAllUsers);
router.delete("/delete/:id", auth, isAdmin, deleteUser);

module.exports = router;
