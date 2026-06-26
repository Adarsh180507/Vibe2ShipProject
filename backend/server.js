const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Task = require("./models/Task");
const { breakDownTask } = require("./services/aiService");
const app = express();
const PORT = process.env.PORT || 5000;
const { parseVoiceToTask } = require("./services/aiService");
const Habit = require("./models/Habit");
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

// --- HABIT ROUTES ---

// Get all habits
app.get("/api/habits", async (req, res) => {
  try {
    const habits = await Habit.find();
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch habits" });
  }
});

// Add a new habit
app.post("/api/habits", async (req, res) => {
  try {
    const habit = await Habit.create(req.body);
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: "Failed to create habit" });
  }
});

// Complete a habit (Increment or Reset Streak)
app.put("/api/habits/:id/complete", async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Habit not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastCompletedDate = habit.lastCompleted
      ? new Date(habit.lastCompleted)
      : null;
    if (lastCompletedDate) lastCompletedDate.setHours(0, 0, 0, 0);

    // Check if it was already completed today
    if (lastCompletedDate && lastCompletedDate.getTime() === today.getTime()) {
      return res.json(habit); // Do nothing, already done today
    }

    if (!lastCompletedDate) {
      // First time completing it
      habit.streak = 1;
    } else {
      // Calculate days between today and last completion
      const diffTime = Math.abs(today - lastCompletedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        habit.streak += 1; // Perfect streak
      } else {
        habit.streak = 1; // Missed a day, streak resets
      }
    }

    habit.lastCompleted = new Date();
    await habit.save();
    res.json(habit);
  } catch (error) {
    console.error("Habit Error:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
});
// Edit a habit's title
app.put("/api/habits/:id", async (req, res) => {
  try {
    const updatedHabit = await Habit.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title }, // We only want them to edit the name, not cheat the streak
      { new: true },
    );
    if (!updatedHabit)
      return res.status(404).json({ message: "Habit not found" });
    res.json(updatedHabit);
  } catch (error) {
    console.error("Error updating habit:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
});

// Delete a habit
app.delete("/api/habits/:id", async (req, res) => {
  try {
    const deletedHabit = await Habit.findByIdAndDelete(req.params.id);
    if (!deletedHabit)
      return res.status(404).json({ message: "Habit not found" });
    res.json({ message: "Habit deleted" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    res.status(500).json({ error: "Failed to delete habit" });
  }
});
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
