const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
    },

    deadline: {
      type: Date,
      required: true,
    },

    note: {
      type: String,
      required: true,
      trim: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tag: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      default: null,
    },

    image: {
      url: {
        type: String,
        default: "",
      },
      downloadUrl: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
      originalName: {
        type: String,
        default: "",
      },
    },

    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    status: {
      type: String,
     enum: ["pending", "progress", "completed", "inactive"],
      default: "pending", // ✅ initial state
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
