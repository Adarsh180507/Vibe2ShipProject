const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { generateTaskStrategy } = require("../services/aiService");

// 1. Create a new task
router.post("/", async (req, res) => {
  try {
    const { title, description, deadline, estimatedEffort, priority } =
      req.body;
    const newTask = new Task({
      title,
      description,
      deadline,
      estimatedEffort,
      priority,
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ deadline: 1 }); // Sort by closest deadline first
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. AI Route: Trigger Intelligent Prioritization & Analytics
router.get("/ai-analyze", async (req, res) => {
  try {
    // Fetch only pending or in-progress tasks to optimize context window size
    const pendingTasks = await Task.find({ status: { $ne: "Completed" } });

    if (pendingTasks.length === 0) {
      return res.status(200).json({
        recommendations:
          "You have no active tasks at the moment! Add some tasks to see your AI companion in action.",
      });
    }

    const aiResponse = await generateTaskStrategy(pendingTasks);
    res.status(200).json({ recommendations: aiResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
