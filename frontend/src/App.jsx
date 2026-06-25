import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Calendar,
  Clock,
  BrainCircuit,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/tasks", newTask);
      setNewTask({
        title: "",
        deadline: "",
        estimatedEffort: 1,
        priority: "Medium",
      });
      fetchTasks();
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
        {/* Left Column: Form & Task List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Add Task Form */}
          <section className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-indigo-500/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-300">
              <PlusCircle className="w-5 h-5" /> Add New Task
            </h2>

            <form onSubmit={handleAddTask} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  What needs to be done?
                </label>
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

              <button
                type="submit"
                className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all w-full sm:w-auto self-start shadow-md hover:shadow-indigo-500/25 active:scale-95"
              >
                Add Task
              </button>
            </form>
          </section>

          {/* Task List */}
          <section className="bg-slate-800/20 border border-slate-700/50 p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Active Tasks
            </h2>

            {tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/10">
                Your slate is clean. Add a task above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="group bg-slate-800/60 border border-slate-600/50 p-5 rounded-xl hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <h3 className="font-semibold text-lg mb-3 text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {task.title}
                    </h3>
                    <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />{" "}
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> {task.estimatedEffort}h
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${
                          task.priority === "High"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : task.priority === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {task.priority.toUpperCase()}
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
              {aiInsight && typeof aiInsight === "object" ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl">
                    <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                      {aiInsight.summary}
                    </p>
                  </div>

                  {/* Execution Schedule */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Action Plan
                    </h3>
                    <div className="space-y-3">
                      {aiInsight.schedule.map((item, idx) => (
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

                  {/* Pro Tips */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Pro Tip
                    </h3>
                    {aiInsight.tips.map((tip, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl"
                      >
                        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-sm text-emerald-100">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center gap-3 mt-12">
                  <BrainCircuit className="w-12 h-12 text-slate-600/50" />
                  <p>
                    Click the button above to let AI analyze your tasks and
                    build an optimal execution plan.
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
