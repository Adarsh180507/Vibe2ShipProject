import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Sparkles,
  Calendar,
  Clock,
  BrainCircuit,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Mic,
  CalendarPlus,
  Bell,
  Flame,
  LogOut,
  ArrowRight,
} from "lucide-react";
import "./App.css";

function App() {
  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState("login"); // 'login', 'signup', 'dashboard'
  const [newHabitTitle, setNewHabitTitle] = useState("");
  // --- APP STATE ---
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    Notification ? Notification.permission : "default",
  );
  const notifiedTasks = useRef(new Set());

  // --- FORM STATE ---
  const [newTask, setNewTask] = useState({
    title: "",
    deadline: "",
    estimatedEffort: 1,
    priority: "Medium",
  });

  const handleEditClick = (task) => {
    setEditingId(task._id);
    // Convert ISO string from MongoDB to format compatible with datetime-local
    const date = new Date(task.deadline);
    const formattedDateTime = date.toISOString().slice(0, 16);
    setNewTask({
      title: task.title,
      deadline: formattedDateTime,
      estimatedEffort: task.estimatedEffort,
      priority: task.priority,
    });
  };

  useEffect(() => {
    if (currentView === "dashboard") {
      fetchTasks();
      fetchHabits();
    }
  }, [currentView]);

  // --- CONTEXT-AWARE BACKGROUND SCANNER ---
  useEffect(() => {
    // Only run if the user clicked "Enable Alerts" and we have active tasks
    if (notificationPermission !== "granted" || tasks.length === 0) return;

    const checkDeadlines = () => {
      const now = new Date();

      tasks.forEach((task) => {
        const deadline = new Date(task.deadline);
        const timeUntilDueMs = deadline - now;
        const minutesUntilDue = timeUntilDueMs / (1000 * 60);

        // Alert if the task is due in less than 60 minutes, but not in the past
        if (
          minutesUntilDue > 0 &&
          minutesUntilDue <= 60 &&
          !notifiedTasks.current.has(task._id)
        ) {
          new Notification("Task Starting Soon: " + task.title, {
            body: `It's due in ${Math.round(minutesUntilDue)} minutes.`,
          });
          notifiedTasks.current.add(task._id);
        }
      });
    };

    // Run the check immediately on load
    checkDeadlines();

    // Then set up the heartbeat to check again every 60 seconds
    const interval = setInterval(checkDeadlines, 60000);

    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, [tasks, notificationPermission]);

  // --- API HANDLERS ---
  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchHabits = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/habits");
      setHabits(res.data);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/tasks/${editingId}`,
          newTask,
        );
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/tasks", newTask);
      }
      setNewTask({
        title: "",
        deadline: "",
        estimatedEffort: 1,
        priority: "Medium",
      });
      fetchTasks();
      setAiInsight("");
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
        fetchTasks();
        if (editingId === taskId) cancelEdit();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleBreakdown = async (taskId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/tasks/${taskId}/breakdown`,
      );
      setTasks(
        tasks.map((t) => (t._id === taskId ? { ...t, subTasks: res.data } : t)),
      );
    } catch (error) {
      console.error("Failed to generate task breakdown:", error);
    }
  };
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/habits", {
        title: newHabitTitle,
      });
      setNewHabitTitle("");
      fetchHabits();
    } catch (error) {
      console.error("Failed to add habit:", error);
    }
  };

  const handleEditHabit = async (e, habit) => {
    e.stopPropagation(); // Prevents the card from triggering "complete" when you click edit
    const newTitle = window.prompt("Edit habit title:", habit.title);
    if (newTitle && newTitle.trim() !== "" && newTitle !== habit.title) {
      try {
        await axios.put(`http://localhost:5000/api/habits/${habit._id}`, {
          title: newTitle,
        });
        fetchHabits();
      } catch (error) {
        console.error("Failed to edit habit:", error);
      }
    }
  };

  const handleDeleteHabit = async (e, habitId) => {
    e.stopPropagation(); // Prevents the card from triggering "complete"
    if (
      window.confirm(
        "Are you sure you want to delete this habit and its streak?",
      )
    ) {
      try {
        await axios.delete(`http://localhost:5000/api/habits/${habitId}`);
        fetchHabits();
      } catch (error) {
        console.error("Failed to delete habit:", error);
      }
    }
  };
  const handleCompleteHabit = async (habitId) => {
    try {
      await axios.put(`http://localhost:5000/api/habits/${habitId}/complete`);
      fetchHabits();
    } catch (error) {
      console.error("Failed to complete habit:", error);
    }
  };

  const getAiStrategy = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/ai-analyze");
      if (res.data && res.data.recommendations) {
        setAiInsight(res.data.recommendations);
      } else if (res.data && res.data.summary) {
        setAiInsight(res.data);
      } else {
        setAiInsight({
          summary: "Received unexpected data format from the AI.",
          schedule: [],
          tips: [],
        });
      }
    } catch (error) {
      setAiInsight(
        "Failed to generate AI insights. Check your backend console.",
      );
    }
    setLoading(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewTask({
      title: "",
      deadline: "",
      estimatedEffort: 1,
      priority: "Medium",
    });
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return alert("Your browser does not support voice input. Try Chrome.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      try {
        const res = await axios.post("http://localhost:5000/api/tasks/voice", {
          transcript,
        });
        setNewTask(res.data);
      } catch (error) {
        console.error("Failed to parse voice command:", error);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window))
      return alert("Desktop notifications not supported.");
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleExportCalendar = (task) => {
    const startDate = new Date(task.deadline);
    const endDate = new Date(task.deadline);
    endDate.setHours(endDate.getHours() + Math.ceil(task.estimatedEffort));
    const formatDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${task.title}\nDESCRIPTION:Priority: ${task.priority} | AI Productivity Companion\nDTSTART:${formatDate(startDate)}\nDTEND:${formatDate(endDate)}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${task.title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isHabitDoneToday = (lastCompleted) => {
    if (!lastCompleted) return false;
    return new Date().toDateString() === new Date(lastCompleted).toDateString();
  };

  const getProcessedTasks = () => {
    return tasks
      .map((task) => {
        const hoursUntilDue =
          (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
        const isCritical =
          (hoursUntilDue < 12 && task.priority === "High") || hoursUntilDue < 0;
        return { ...task, isCritical };
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  };

  const sortedTasks = getProcessedTasks();

  // --- VIEWS ---

  if (currentView === "login" || currentView === "signup") {
    const isLogin = currentView === "login";
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <BrainCircuit className="w-16 h-16 text-indigo-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-slate-400 text-center mb-8">
            {isLogin
              ? "Sign in to your AI workspace"
              : "Start your proactive journey"}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentView("dashboard");
            }}
            className="space-y-5"
          >
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              {isLogin ? "Sign In" : "Sign Up"}{" "}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setCurrentView(isLogin ? "signup" : "login")}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              {isLogin ? "Sign up here" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* DASHBOARD HEADER */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center mt-4">
        <div className="flex-1 flex justify-start w-full md:w-auto mb-6 md:mb-0">
          <button
            onClick={() => setCurrentView("login")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="text-center flex-1">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <BrainCircuit className="w-10 h-10 text-indigo-400" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
              AI Productivity Companion
            </h1>
          </div>
          <p className="text-lg text-slate-400 font-medium tracking-wide">
            Proactive task management powered by Gemini
          </p>
        </div>

        <div className="flex-1 flex justify-end mt-6 md:mt-0 w-full md:w-auto">
          {notificationPermission !== "granted" ? (
            <button
              onClick={requestNotificationPermission}
              className="flex items-center justify-center w-full md:w-auto gap-2 text-sm font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-4 py-2 rounded-full border border-amber-400/20 transition-all"
            >
              <Bell className="w-4 h-4 animate-bounce" /> Enable Alerts
            </button>
          ) : (
            <span className="flex items-center justify-center w-full md:w-auto gap-2 text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
              <Bell className="w-4 h-4" /> Alerts Active
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main App Area */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* DAILY HABITS UI */}
          {/* DAILY HABITS UI */}
          <section className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Daily Habits
              </h2>

              {/* Add New Habit Form */}
              <form
                onSubmit={handleAddHabit}
                className="flex gap-2 w-full sm:w-auto"
              >
                <input
                  type="text"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  placeholder="New daily habit..."
                  className="bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 w-full sm:w-48"
                />
                <button
                  type="submit"
                  className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Add
                </button>
              </form>
            </div>

            {habits.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4 border-2 border-dashed border-slate-700 rounded-xl">
                No habits tracked yet. Create one above!
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {habits.map((habit) => {
                  const doneToday = isHabitDoneToday(habit.lastCompleted);
                  return (
                    // Changed from <button> to <div> so we can nest the action buttons without HTML errors
                    <div
                      key={habit._id}
                      onClick={() =>
                        !doneToday && handleCompleteHabit(habit._id)
                      }
                      className={`group relative min-w-[160px] flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 ${
                        doneToday
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-slate-800 border-slate-600/50 hover:border-orange-500/50 hover:bg-slate-700 cursor-pointer active:scale-95"
                      }`}
                    >
                      {/* Hover Action Icons (Edit/Delete) */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        <button
                          onClick={(e) => handleEditHabit(e, habit)}
                          className="p-1 bg-slate-900/80 hover:bg-indigo-500 text-slate-400 hover:text-white rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteHabit(e, habit._id)}
                          className="p-1 bg-slate-900/80 hover:bg-red-500 text-slate-400 hover:text-white rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-2 mt-2">
                        <Flame
                          className={`w-5 h-5 ${doneToday ? "text-emerald-400" : habit.streak > 0 ? "text-orange-500" : "text-slate-500"}`}
                        />
                        <span
                          className={`text-xl font-black ${doneToday ? "text-emerald-400" : "text-slate-200"}`}
                        >
                          {habit.streak}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold text-center px-2 ${doneToday ? "text-emerald-500" : "text-slate-400"}`}
                      >
                        {habit.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ADD/EDIT TASK FORM */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-300">
              {editingId ? (
                <Edit2 className="w-5 h-5" />
              ) : (
                <PlusCircle className="w-5 h-5" />
              )}
              {editingId ? "Edit Task" : "Add New Task"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-300">
                    What needs to be done?
                  </label>
                  <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${isListening ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20"}`}
                  >
                    <Mic className="w-3.5 h-3.5" />{" "}
                    {isListening ? "Listening..." : "Dictate"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g., Complete UI overhaul"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newTask.deadline}
                    onChange={(e) =>
                      setNewTask({ ...newTask, deadline: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Effort (hrs)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={newTask.estimatedEffort}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        estimatedEffort: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all w-full sm:w-auto shadow-md active:scale-95"
                >
                  {editingId ? "Update Task" : "Add Task"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-all w-full sm:w-auto shadow-md active:scale-95"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* ACTIVE TASKS LIST */}
          <section className="bg-slate-800/20 border border-slate-700/50 p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Active Tasks
            </h2>
            {sortedTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/10">
                Your slate is clean.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {sortedTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`group relative p-5 rounded-xl transition-all duration-300 ${task.isCritical ? "bg-red-950/20 border border-red-500/50 hover:border-red-400" : editingId === task._id ? "bg-slate-800/60 border-indigo-500 ring-1 ring-indigo-500/50" : "bg-slate-800/60 border border-slate-600/50 hover:border-indigo-500/50 hover:-translate-y-1"}`}
                  >
                    {task.isCritical && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                        URGENT
                      </span>
                    )}
                    <h3 className="font-semibold text-lg mb-3 text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {task.title}
                    </h3>
                    <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                      <span>
                        <Calendar className="w-4 h-4 inline" />{" "}
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      <span>
                        <Clock className="w-4 h-4 inline" />{" "}
                        {task.estimatedEffort}h
                      </span>
                    </div>

                    {task.subTasks && task.subTasks.length > 0 && (
                      <div className="mt-3 mb-4 p-3 bg-slate-900/40 rounded-lg space-y-2 border border-slate-700/30">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          AI Action Plan:
                        </p>
                        {task.subTasks.map((sub, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                              onChange={() => {
                                const updatedTasks = [...tasks];
                                const taskIndex = updatedTasks.findIndex(
                                  (t) => t._id === task._id,
                                );
                                updatedTasks[taskIndex].subTasks[i].completed =
                                  !updatedTasks[taskIndex].subTasks[i]
                                    .completed;
                                setTasks(updatedTasks);
                              }}
                            />
                            <span
                              className={
                                sub.completed
                                  ? "line-through text-slate-500"
                                  : ""
                              }
                            >
                              {sub.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExportCalendar(task)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                          title="Add to Calendar"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {(!task.subTasks || task.subTasks.length === 0) && (
                        <button
                          onClick={() => handleBreakdown(task._id)}
                          className="text-xs font-semibold flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Break Down
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: AI Insights */}
        <div className="lg:col-span-1 h-full">
          <section className="bg-gradient-to-br from-indigo-900/40 via-slate-800/40 to-purple-900/20 border border-indigo-500/30 p-6 md:p-8 rounded-2xl shadow-xl h-full flex flex-col min-h-[600px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-300 relative z-10">
              <Sparkles className="w-5 h-5" /> Gemini Strategist
            </h2>
            <button
              onClick={getAiStrategy}
              disabled={loading || tasks.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 mb-6 relative z-10"
            >
              {loading ? (
                <span className="flex justify-center gap-2">
                  <BrainCircuit className="w-5 h-5 animate-pulse" /> Analyzing
                  Timeline...
                </span>
              ) : (
                "Generate Smart Schedule"
              )}
            </button>
            <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10">
              {aiInsight &&
              typeof aiInsight === "object" &&
              !aiInsight.error ? (
                <div className="space-y-6">
                  {aiInsight.summary && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl">
                      <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                        {aiInsight.summary}
                      </p>
                    </div>
                  )}
                  {aiInsight.schedule && aiInsight.schedule.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                        Action Plan
                      </h3>
                      <div className="space-y-3">
                        {aiInsight.schedule?.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-800/80 border border-slate-600/50 p-4 rounded-xl"
                          >
                            <h4 className="font-bold text-slate-200 mb-1">
                              {item.taskTitle}
                            </h4>
                            <span className="inline-block bg-slate-700 text-xs font-semibold px-2 py-1 rounded text-indigo-300 mb-2">
                              {item.timeBlock}
                            </span>
                            <p className="text-sm text-slate-400">
                              {item.strategy}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiInsight.tips && aiInsight.tips.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                        Pro Tip
                      </h3>
                      {aiInsight.tips?.map((tip, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl"
                        >
                          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                          <p className="text-sm text-emerald-100">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center gap-3 mt-12">
                  <BrainCircuit className="w-12 h-12 text-slate-600/50" />
                  <p>
                    {typeof aiInsight === "string" && aiInsight !== ""
                      ? aiInsight
                      : "Click above to build an optimal execution plan."}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
