const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Task Routes
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

// ... app.listen ...
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Base Route
app.get("/", (req, res) => {
  res.send("AI Productivity Companion Backend is running.");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is operating smoothly on port ${PORT}`);
});
