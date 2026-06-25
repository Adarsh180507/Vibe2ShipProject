import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loading, setLoading] = useState(false);

  // Form State
  const [newTask, setNewTask] = useState({
    title: "",
    deadline: "",
    estimatedEffort: 1,
    priority: "Medium",
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Handle Form Submission
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/tasks", newTask);
      // Reset form and refresh tasks
      setNewTask({
        title: "",
        deadline: "",
        estimatedEffort: 1,
        priority: "Medium",
      });
      fetchTasks();
      // Clear previous AI insight since the task list changed
      setAiInsight("");
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const getAiStrategy = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/tasks/ai-analyze");
      setAiInsight(res.data.recommendations);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiInsight(
        "Failed to generate AI insights. Check your backend console.",
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header section - Centered */}
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          AI Productivity Companion
        </h1>
        <p className="text-base text-slate-400">
          Proactive task management powered by Gemini AI
        </p>
      </header>

      {/* Main Content Grid - Centered with max-width */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Task List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Add Task Form Container */}
          <section className="bg-slate-800/50 border border-slate-700 p-6 md:p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-300">
              <span>✦</span> Add New Task
            </h2>

            <form onSubmit={handleAddTask} className="flex flex-col gap-5">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  What needs to be done?
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="e.g., Complete UI overhaul"
                />
              </div>

              {/* Grid for Deadline, Effort, Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={newTask.deadline}
                    onChange={(e) =>
                      setNewTask({ ...newTask, deadline: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
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
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full sm:w-auto self-start"
              >
                Add Task
              </button>
            </form>
          </section>

          {/* Task List Container */}
          <section className="bg-slate-800/30 border border-slate-700 p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 text-slate-200">
              Active Tasks
            </h2>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500 border border-dashed border-slate-600 rounded-lg">
                Your slate is clean. Add a task above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-slate-800 border border-slate-600 p-5 rounded-xl hover:border-indigo-500/50 transition-colors"
                  >
                    <h3 className="font-semibold text-lg mb-3 text-slate-100">
                      {task.title}
                    </h3>
                    <div className="flex justify-between items-center text-sm text-slate-400">
                      <span>
                        🗓 {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      <span>⏱ {task.estimatedEffort}h</span>
                    </div>
                    <div className="mt-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                          task.priority === "High"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : task.priority === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-1 h-full">
          <section className="bg-gradient-to-b from-indigo-900/40 to-slate-800/40 border border-indigo-500/30 p-6 rounded-2xl shadow-xl h-full flex flex-col min-h-[500px]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-300">
              🧠 Gemini Strategist
            </h2>

            <button
              onClick={getAiStrategy}
              disabled={loading || tasks.length === 0}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loading ? "Analyzing Timeline..." : "Generate Smart Schedule"}
            </button>

            {/* Response Area */}
            <div className="flex-grow bg-slate-900/80 rounded-xl p-5 border border-indigo-500/20 overflow-y-auto custom-scrollbar">
              {aiInsight ? (
                <div className="text-sm text-indigo-50 leading-relaxed space-y-2">
                  {/* Temporary pre-wrap until we add markdown */}
                  <pre className="whitespace-pre-wrap font-sans break-words">
                    {aiInsight}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                  Click the button above to let AI analyze your tasks and build
                  an optimal execution plan.
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
