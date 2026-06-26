const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Task = require("./models/Task");
const { breakDownTask } = require("./services/aiService");
const app = express();
const PORT = process.env.PORT || 5000;
const { parseVoiceToTask } = require("./services/aiService");

// Middleware
app.use(cors());
app.use(express.json());

// Mount Task Routes
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// ... app.listen ...
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.error("MongoDB connection error:", err));

// DELETE a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// UPDATE a task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(updatedTask);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});
app.get("/", (req, res) => {
  res.send("AI Productivity Companion Backend is running.");
});
app.post("/api/tasks/:id/breakdown", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Call Gemini to break down the task
    const subTasks = await breakDownTask(task.title);

    // Optional: Save the subtasks back to your MongoDB document
    task.subTasks = subTasks;
    await task.save();

    // Send the JSON array back to the frontend
    res.json(subTasks);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ error: "Failed to generate breakdown" });
  }
});

app.post("/api/tasks/voice", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript)
      return res.status(400).json({ error: "No transcript provided" });

    const taskData = await parseVoiceToTask(transcript);
    res.json(taskData);
  } catch (error) {
    console.error("Voice processing failed:", error);
    res.status(500).json({ error: "Failed to process voice command" });
  }
});
// Start Server
app.listen(PORT, () => {
  console.log(`Server is operating smoothly on port ${PORT}`);
});
