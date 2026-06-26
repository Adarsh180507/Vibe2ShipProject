const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    estimatedEffort: {
      type: Number, // Estimated hours to complete
      default: 1,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    aiRecommendations: {
      type: String, // Store proactive AI breakdown or schedule advice here
      default: "",
    },
    // NEW: Added subTasks array to store the AI's breakdown
    subTasks: [
      {
        text: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Task", TaskSchema);
