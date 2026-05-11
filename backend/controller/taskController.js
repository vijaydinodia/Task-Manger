const User = require("../model/userModel");
const Task = require("../model/taskModel");
const Tag = require("../model/tagModel");
const transporter = require("../transporter");
const XLSX = require("xlsx");
const { uploadImage } = require("../utility/cloudnairy");

const priorityOrder = {
  high: 1,
  medium: 2,
  low: 3,
};

const normalizePriority = (priority) => {
  const normalized = priority?.toString().trim().toLowerCase();
  return ["high", "medium", "low"].includes(normalized) ? normalized : "medium";
};

const sortByPriority = (a, b) =>
  (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);

const tagColors = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
];

// get task tags
exports.getTags = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const tags = await Tag.find().sort({ createdAt: 1, name: 1 });

    return res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// create task tag
exports.createTag = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const name = req.body.name?.toString().trim();

    if (!name) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    const existingTag = await Tag.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });

    if (existingTag) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const totalTags = await Tag.countDocuments();
    const tag = await Tag.create({
      name,
      color: tagColors[totalTags % tagColors.length],
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Tag created",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//add task
exports.addTask = async (req, res) => {
  try {
    const { taskName, deadline, note, assignedTo, priority, tag } = req.body;
    // console.log(">>>>>>>req.body>>>>>>>>>", req.body);

    if (!taskName || !deadline || !note || !assignedTo) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const assignedUser = await User.findById(assignedTo).select("name email");

    if (!assignedUser) {
      return res.status(404).json({ message: "Assigned user not found" });
    }

    if (tag) {
      const existingTag = await Tag.findById(tag);

      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
    }

    let image = {};

    if (req.file) {
      const [uploadedImage] = await uploadImage([req.file]);

      if (!uploadedImage?.secure_url) {
        return res.status(500).json({ message: "Failed to upload task image" });
      }

      image = {
        url: uploadedImage.secure_url,
        downloadUrl: uploadedImage.secure_url.replace(
          "/upload/",
          "/upload/fl_attachment/",
        ),
        publicId: uploadedImage.public_id,
        originalName: req.file.originalname,
      };
    }

    const task = await Task.create({
      taskName: taskName.trim(),
      deadline,
      note: note.trim(),
      assignedTo,
      createdBy: req.user._id,
      priority: normalizePriority(priority),
      tag: tag || null,
      image,
    });

    // send email safely
    try {
      await transporter.sendMail({
        from: `"${req.user?.name || "Admin"}" <${process.env.EMAIL_USER}>`,
        to: assignedUser.email,
        subject: "📌 New Task Assigned",
        html: `
          <h3>Hello ${assignedUser.name}</h3>
          <p>You have a new task</p>
          <p><b>${task.taskName}</b></p>
          <p>Priority: ${task.priority}</p>
          <p>Deadline: ${new Date(task.deadline).toDateString()}</p>
        `,
      });
    } catch (err) {
      console.log("Email error:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Task created",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//bulk add tasks from xlsx
exports.bulkAddTasks = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "XLSX file is required" });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
      raw: false,
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: "XLSX file has no rows" });
    }

    const createdTasks = [];
    const failedRows = [];

    for (const [index, row] of rows.entries()) {
      const taskName = row.taskName || row["Task Name"] || row.title || row.Title;
      const deadline = row.deadline || row.Deadline || row.date || row.Date;
      const note = row.note || row.Note || row.description || row.Description;
      const priority = normalizePriority(
        (row.priority || row.Priority || "medium").toString().trim().toLowerCase(),
      );
      const assignedEmail =
        row.assignedEmail ||
        row["Assigned Email"] ||
        row.assignedTo ||
        row["Assigned To"];
      const hasTaskDetails = taskName || deadline || note;

      if (!hasTaskDetails) {
        continue;
      }

      if (!taskName || !deadline || !note || !assignedEmail) {
        failedRows.push({
          row: index + 2,
          message: "taskName, deadline, note, and assignedEmail are required",
        });
        continue;
      }

      const assignedUser = await User.findOne({
        email: assignedEmail.toString().trim().toLowerCase(),
        status: "active",
      }).select("_id name email");

      if (!assignedUser) {
        failedRows.push({
          row: index + 2,
          message: `Active user not found for ${assignedEmail}`,
        });
        continue;
      }

      const parsedDeadline = new Date(deadline);

      if (Number.isNaN(parsedDeadline.getTime())) {
        failedRows.push({
          row: index + 2,
          message: "Invalid deadline",
        });
        continue;
      }

      const task = await Task.create({
        taskName: taskName.toString().trim(),
        deadline: parsedDeadline,
        note: note.toString().trim(),
        assignedTo: assignedUser._id,
        createdBy: req.user._id,
        priority,
      });

      try {
        await transporter.sendMail({
          from: `"${req.user?.name || "Admin"}" <${process.env.EMAIL_USER}>`,
          to: assignedUser.email,
          subject: "New Task Assigned",
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
              <h2 style="margin:0 0 12px;color:#4f46e5">New Task Assigned</h2>
              <p>Hello ${assignedUser.name || "there"},</p>
              <p>You have been assigned a new task from bulk upload.</p>
              <div style="margin:18px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc">
                <p style="margin:0 0 8px"><strong>Task:</strong> ${task.taskName}</p>
                <p style="margin:0 0 8px"><strong>Priority:</strong> ${task.priority}</p>
                <p style="margin:0 0 8px"><strong>Deadline:</strong> ${new Date(task.deadline).toDateString()}</p>
                <p style="margin:0"><strong>Note:</strong> ${task.note}</p>
              </div>
              <p>Please login to Task Manager to view and update your task.</p>
            </div>
          `,
        });
      } catch (err) {
        console.log("Bulk task email error:", err.message);
      }

      createdTasks.push(task);
    }

    return res.status(201).json({
      success: true,
      message: `${createdTasks.length} tasks imported`,
      createdCount: createdTasks.length,
      failedCount: failedRows.length,
      failedRows,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//download sample xlsx for bulk task upload
exports.downloadBulkTaskTemplate = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({ status: "active" })
      .select("name email role")
      .sort({ name: 1, email: 1 });

    const templateRows = users.map((user) => ({
      taskName: "",
      deadline: "",
      priority: "medium",
      note: "",
      assignedEmail: user.email,
      assignedName: user.name,
      role: user.role,
    }));

    const headers = [
      "taskName",
      "deadline",
      "priority",
      "note",
      "assignedEmail",
      "assignedName",
      "role",
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateRows, {
      header: headers,
      skipHeader: false,
    });

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 14 },
      { wch: 12 },
      { wch: 42 },
      { wch: 32 },
      { wch: 24 },
      { wch: 12 },
    ];

    const instructions = XLSX.utils.aoa_to_sheet([
      ["Bulk Upload Instructions"],
      [""],
      ["Fill taskName, deadline, and note for each user row you want to import."],
      ["Set priority to high, medium, or low. Blank priority defaults to medium."],
      ["Keep assignedEmail unchanged so the task is assigned to the correct user."],
      ["Use deadline format YYYY-MM-DD, for example 2026-06-30."],
      ["Rows with no task details are skipped. Partially filled rows are reported after upload."],
    ]);
    instructions["!cols"] = [{ wch: 88 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Task Template");
    XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=\"bulk-task-template.xlsx\"",
    );

    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get my tasks
exports.getTaskByUser = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("tag", "name color");

    tasks.sort((a, b) => {
      const priorityResult = sortByPriority(a, b);
      if (priorityResult !== 0) return priorityResult;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { sortBy = "newest", search = "" } = req.query;
    const sortKeys = sortBy.split(",").filter(Boolean);
    const searchText = search.trim();

    const sortOptions = {
      newest: { createdAt: -1 },
      deadline: { deadline: 1 },
    };

    const taskQuery = {};

    if (searchText) {
      const searchRegex = new RegExp(searchText, "i");
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const matchingUserIds = matchingUsers.map((user) => user._id);
      const matchingTags = await Tag.find({ name: searchRegex }).select("_id");
      const matchingTagIds = matchingTags.map((tag) => tag._id);

      taskQuery.$or = [
        { taskName: searchRegex },
        { note: searchRegex },
        { status: searchRegex },
        { priority: searchRegex },
        { tag: { $in: matchingTagIds } },
        { assignedTo: { $in: matchingUserIds } },
        { createdBy: { $in: matchingUserIds } },
      ];
    }

    let tasks = await Task.find(taskQuery)
      .sort(
        sortKeys.includes("deadline")
          ? sortOptions.deadline
          : sortOptions.newest,
      )
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("tag", "name color");

    const statusOrder = {
      pending: 1,
      progress: 2,
      completed: 3,
      inactive: 4,
    };

    const sortByStatus = (a, b) =>
      (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);

    const sortByAssignedTo = (a, b) =>
      (a.assignedTo?.name || "").localeCompare(b.assignedTo?.name || "");

    const sortByCreatedBy = (a, b) =>
      (a.createdBy?.name || "").localeCompare(b.createdBy?.name || "");

    const sortFns = [];

    sortFns.push(sortByPriority);

    if (sortKeys.includes("status")) {
      sortFns.push(sortByStatus);
    }

    if (sortKeys.includes("assignedTo")) {
      sortFns.push(sortByAssignedTo);
    }

    if (sortKeys.includes("createdBy")) {
      sortFns.push(sortByCreatedBy);
    }

    tasks = tasks.sort((a, b) => {
      for (const sortFn of sortFns) {
        const result = sortFn(a, b);
        if (result !== 0) return result;
      }

      if (sortKeys.includes("deadline")) {
        return new Date(a.deadline || 0) - new Date(b.deadline || 0);
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskName, deadline, note, assignedTo, status, priority, tag } = req.body;

    const task = await Task.findById(id);

    // ✅ check task exists
    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    const isTaskUser =
      task.createdBy?.toString() === req.user._id.toString() || isAssignee;

    if (!isAdmin && !isTaskUser) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (priority !== undefined && !isAdmin && !isAssignee) {
      return res.status(403).json({
        message: "Only admin or assigned user can change priority",
      });
    }

    if (tag !== undefined && !isAdmin) {
      return res.status(403).json({
        message: "Only admin can change task tag",
      });
    }

    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        status: "active",
      });

      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned active user not found" });
      }
    }

    if (tag) {
      const existingTag = await Tag.findById(tag);

      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
    }

    if (taskName !== undefined) task.taskName = taskName.trim();
    if (deadline !== undefined) task.deadline = deadline;
    if (note !== undefined) task.note = note.trim();
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = normalizePriority(priority);
    if (tag !== undefined) task.tag = tag || null;

    const updatedTask = await task.save();
    await updatedTask.populate("assignedTo", "name email");
    await updatedTask.populate("createdBy", "name email");
    await updatedTask.populate("tag", "name color");

    return res.status(200).json({
      success: true,
      message: "Task updated",
      data: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

//start task
exports.startTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user.role === "admin";
    const isTaskUser =
      task.createdBy?.toString() === req.user._id ||
      task.assignedTo?.toString() === req.user._id;

    if (!isAdmin && !isTaskUser) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (task.status !== "pending") {
      return res.status(400).json({
        message: "Only pending task can be started",
      });
    }

    task.status = "progress";
    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("tag", "name color");

    return res.status(200).json({
      success: true,
      message: "Task started",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//complete task
exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAdmin = req.user.role === "admin";
    const isTaskUser =
      task.createdBy?.toString() === req.user._id ||
      task.assignedTo?.toString() === req.user._id;

    if (!isAdmin && !isTaskUser) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (task.status !== "progress") {
      return res.status(400).json({
        message: "Task must be in progress to complete",
      });
    }

    task.status = "completed";
    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("tag", "name color");

    return res.status(200).json({
      success: true,
      message: "Task completed",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      req.user.role !== "admin" &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only creator can delete task",
      });
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//soft delete task
exports.softDeleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.user.role !== "admin" &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only creator or admin can soft delete task",
      });
    }

    if (task.status === "completed") {
      return res.status(400).json({
        message: "Completed task cannot be deleted",
      });
    }

    task.status = "inactive"; // ⚠️ only if your schema allows it
    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("tag", "name color");

    return res.status(200).json({
      success: true,
      message: "Task soft deleted",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//restore task
exports.restoreTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.user.role !== "admin" &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Only creator or admin can restore task",
      });
    }

    if (task.status !== "inactive") {
      return res.status(400).json({
        message: "Only inactive task can be restored",
      });
    }

    task.status = "pending";
    await task.save();
    await task.populate("assignedTo", "name email");
    await task.populate("createdBy", "name email");
    await task.populate("tag", "name color");

    return res.status(200).json({
      success: true,
      message: "Task restored",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//admin route 
exports.adminDashboard = async (req, res) => {
  try {
    // only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();

    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const progressTasks = await Task.countDocuments({ status: "progress" });
    const completedTasks = await Task.countDocuments({ status: "completed" });

    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: "completed" },
    });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt");

    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "name")
      .populate("createdBy", "name")
      .populate("tag", "name color");

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTasks,
        pendingTasks,
        progressTasks,
        completedTasks,
        overdueTasks,
        recentUsers,
        recentTasks,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
