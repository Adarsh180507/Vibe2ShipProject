const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// 1. Initialize the SDK with the key directly
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateTaskStrategy(tasks) {
  try {
    const tasksSummary = tasks
      .map(
        (task, index) =>
          `${index + 1}. Title: ${task.title}\n   Description: ${task.description || "N/A"}\n   Deadline: ${task.deadline}\n   Estimated Effort: ${task.estimatedEffort} hours\n   Current Priority: ${task.priority}`,
      )
      .join("\n\n");

    const prompt = `
      You are an expert AI Productivity Companion. Analyze the following list of active tasks for a user and provide:
      1. An optimized order of execution (Intelligent Task Prioritization).
      2. A realistic timeline/schedule snippet for today/tomorrow based on deadlines and estimated efforts (AI-powered Scheduling).
      3. Proactive actionable insights to avoid missing the closest deadlines (Personalized Recommendations).

      Tasks:
      ${tasksSummary}

      Format your response clearly using clean Markdown text with bullet points. Keep it professional, highly encouraging, and directly actionable.
    `;

    // 2. Instantiate the specific model (using 1.5-flash for the fastest response times)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Generate the content
    const result = await model.generateContent(prompt);

    // 4. Extract and return the text
    return result.response.text();
  } catch (error) {
    console.error("Error interacting with Gemini API:", error);
    throw new Error("AI generation failed.");
  }
}

module.exports = {
  generateTaskStrategy,
};
