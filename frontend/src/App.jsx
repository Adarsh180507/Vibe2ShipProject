import { useState, useEffect } from "react";
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
} from "lucide-react";
import "./App.css";

function App() {
  // App State
  const [isListening, setIsListening] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [newTask, setNewTask] = useState({
    title: "",
    deadline: "",
    estimatedEffort: 1,
    priority: "Medium",
  });

  // Initial Load
  useEffect(() => {
    fetchTasks();
  }, []);

  // --- API HANDLERS ---
  // --- SMART URGENCY SORTING ---
  const getProcessedTasks = () => {
    return tasks
      .map((task) => {
        const hoursUntilDue =
          (new Date(task.deadline) - new Date()) / (1000 * 60 * 60);
        const safeHours = Math.max(hoursUntilDue, 0.5);

        // Only mark as critical if deadline is within 12 hours AND it's a high priority task
        // OR if it's already overdue (hoursUntilDue < 0)
        const isCritical =
          (hoursUntilDue < 12 && task.priority === "High") || hoursUntilDue < 0;

        return { ...task, isCritical };
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)); // Simple sort by date
  };

  const sortedTasks = getProcessedTasks();
  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);

      try {
        const res = await axios.post("http://localhost:5000/api/tasks/voice", {
          transcript,
        });
        // Auto-fill the form with the AI-parsed data
        setNewTask(res.data);
      } catch (error) {
        console.error("Failed to parse voice command:", error);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };
  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing task
        await axios.put(
          `http://localhost:5000/api/tasks/${editingId}`,
          newTask,
        );
        setEditingId(null);
      } else {
        // Add new task
        await axios.post("http://localhost:5000/api/tasks", newTask);
      }

      // Reset form and refresh
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
        // If the user deletes the task they are currently editing, reset the form
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
      // Optimistically update frontend state
      setTasks(
        tasks.map((t) => (t._id === taskId ? { ...t, subTasks: res.data } : t)),
      );
    } catch (error) {
      console.error("Failed to generate task breakdown:", error);
    }
  };

  const getAiStrategy = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/ai-analyze");

      console.log("Raw AI Response from Backend:", res.data);

      // Smart unwrapping based on backend response shape
      if (res.data && res.data.recommendations) {
        setAiInsight(res.data.recommendations);
      } else if (res.data && res.data.summary) {
        setAiInsight(res.data);
      } else {
        console.warn("Unexpected AI data shape.");
        setAiInsight({
          summary: "Received unexpected data format from the AI.",
          schedule: [],
          tips: [],
        });
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiInsight(
        "Failed to generate AI insights. Check your backend console.",
      );
    }
    setLoading(false);
  };

  // --- UI HELPERS ---

  const handleEditClick = (task) => {
    setEditingId(task._id);
    // Format the date for the input field (YYYY-MM-DD)
    const formattedDate = new Date(task.deadline).toISOString().split("T")[0];
    setNewTask({
      title: task.title,
      deadline: formattedDate,
      estimatedEffort: task.estimatedEffort,
      priority: task.priority,
    });
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <header className="max-w-6xl mx-auto mb-12 text-center mt-4">
        <div className="inline-flex items-center justify-center gap-3 mb-4">
          <BrainCircuit className="w-10 h-10 text-indigo-400" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
            AI Productivity Companion
          </h1>
        </div>
        <p className="text-lg text-slate-400 font-medium tracking-wide">
          Proactive task management powered by Gemini
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Form & Task List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-indigo-500/5">
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
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isListening
                        ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30"
                        : "bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
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
                  className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  placeholder="e.g., Complete UI overhaul"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={newTask.deadline}
                    onChange={(e) =>
                      setNewTask({ ...newTask, deadline: e.target.value })
                    }
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
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
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
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
                    className="w-full bg-slate-900/50 border border-slate-600/50 rounded-xl p-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner appearance-none"
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
                    className={`group relative p-5 rounded-xl transition-all duration-300 ${
                      task.isCritical
                        ? "bg-red-950/20 border border-red-500/50"
                        : "bg-slate-800/60 border border-slate-600/50 hover:border-indigo-500/50"
                    }`}
                  >
                    {task.isCritical && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        URGENT
                      </span>
                    )}
                    <h3 className="font-semibold text-lg mb-3 text-slate-100 group-hover:text-indigo-300">
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
                    {task.subTasks?.map((sub, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-400 mb-1 flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          readOnly
                        />{" "}
                        {sub.text}
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(task)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {!task.subTasks?.length && (
                        <button
                          onClick={() => handleBreakdown(task._id)}
                          className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 border border-indigo-500/20 px-2 py-1 rounded-md"
                        >
                          <Sparkles className="w-3 h-3" /> Break Down
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed mb-6 relative z-10 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <BrainCircuit className="w-5 h-5 animate-pulse" /> Analyzing
                  Timeline...
                </span>
              ) : (
                "Generate Smart Schedule"
              )}
            </button>

            {/* Structured JSON Response Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10">
              {aiInsight &&
              typeof aiInsight === "object" &&
              !aiInsight.error ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  {aiInsight.summary && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl">
                      <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                        {aiInsight.summary}
                      </p>
                    </div>
                  )}

                  {/* Execution Schedule */}
                  {aiInsight.schedule && aiInsight.schedule.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
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

                  {/* Pro Tips */}
                  {aiInsight.tips && aiInsight.tips.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
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
                      : "Click the button above to let AI analyze your tasks and build an optimal execution plan."}
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
