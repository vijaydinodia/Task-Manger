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
