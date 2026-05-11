const express = require("express");
const router = express.Router();
const multer = require("multer");

const { auth } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");
const storage = multer.memoryStorage();
const fileUpload = multer({ storage });
const imageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
});

const {
  addTask,
  bulkAddTasks,
  createTag,
  downloadBulkTaskTemplate,
  getTags,
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
router.get("/tags", isAdmin, getTags);
router.get("/bulk-template", isAdmin, downloadBulkTaskTemplate);

router.post("/add", imageUpload.single("image"), addTask);
router.post("/tags", isAdmin, createTag);

router.post("/bulk-upload", isAdmin, fileUpload.single("file"), bulkAddTasks);

router.get("/my-tasks", getTaskByUser);

router.put("/update/:id", updateTask);

router.delete("/delete/:id", deleteTask);

router.patch("/soft-delete/:id", softDeleteTask);

router.patch("/start/:id", startTask);

router.patch("/complete/:id", completeTask);

router.patch("/restore/:id", restoreTask);

module.exports = router;
