const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateTaskStrategy(tasks) {
  try {
    const tasksSummary = tasks
      .map(
        (task) =>
          `- ${task.title} (Deadline: ${task.deadline}, Effort: ${task.estimatedEffort}h, Priority: ${task.priority})`,
      )
      .join("\n");

    const prompt = `
      You are an elite productivity coach. Analyze these active tasks:
      ${tasksSummary}

      Return your analysis strictly in the following JSON format. Do not use markdown code blocks, just raw JSON.
      {
        "summary": "A punchy, 2-sentence executive summary of their current workload.",
        "schedule": [
          {
            "taskTitle": "Name of task",
            "timeBlock": "Suggested time to do this (e.g., 'Morning, 2 hrs')",
            "strategy": "One sentence on how to tackle it efficiently"
          }
        ],
        "tips": [
          "A highly specific, actionable productivity tip based on their workload."
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    let rawText = result.response.text();
    rawText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(rawText);
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("AI generation failed.");
  }
}

module.exports = {
  generateTaskStrategy,
};
