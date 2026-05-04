const express = require("express");
const router = express.Router();
const multer = require("multer");

const { auth } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");
const upload = multer({ storage: multer.memoryStorage() });

const {
  addTask,
  bulkAddTasks,
  getTaskByUser,
  getAllTasks,
  updateTask,
  deleteTask,
  softDeleteTask,
  completeTask,
  restoreTask,
  startTask,
  adminDashboard,
} = require("../controller/taskController");

router.use(auth);

router.get("/all", isAdmin, getAllTasks);
router.get("/admin/dashboard", isAdmin, adminDashboard);

router.post("/add", addTask);

router.post("/bulk-upload", isAdmin, upload.single("file"), bulkAddTasks);

router.get("/my-tasks", getTaskByUser);

router.put("/update/:id", updateTask);

router.delete("/delete/:id", deleteTask);

router.patch("/soft-delete/:id", softDeleteTask);

router.patch("/start/:id", startTask);

router.patch("/complete/:id", completeTask);

router.patch("/restore/:id", restoreTask);

module.exports = router;
