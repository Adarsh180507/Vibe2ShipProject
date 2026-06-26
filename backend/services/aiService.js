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
      You are an elite, highly proactive productivity coach. 
      Analyze these active tasks and plan a realistic, high-impact schedule:
      ${tasksSummary}

      Prioritize urgent deadlines and high-effort items first. Provide concrete execution advice.
    `;

    // Enforce schema natively using Gemini's generationConfig
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  taskTitle: { type: "string" },
                  timeBlock: { type: "string" },
                  strategy: { type: "string" },
                },
                required: ["taskTitle", "timeBlock", "strategy"],
              },
            },
            tips: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["summary", "schedule", "tips"],
        },
      },
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // Guaranteed to parse correctly since Gemini strictly followed our schema
    return JSON.parse(rawText);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("AI generation failed.");
  }
}
async function breakDownTask(taskTitle) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Break down the task "${taskTitle}" into exactly 3 small, highly actionable, non-intimidating sub-tasks to beat procrastination. Return a JSON array of strings only. Example: ["Step 1", "Step 2"]`;
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error(error);
    return ["Start working on this task step-by-step."];
  }
}
async function parseVoiceToTask(transcript) {
  try {
    const prompt = `
      Extract task details from this voice transcript: "${transcript}"
      
      Return ONLY a JSON object with these keys (no formatting blocks, raw JSON):
      {
        "title": "Cleaned up task name",
        "deadline": "YYYY-MM-DD format (calculate based on today's date if relative)",
        "estimatedEffort": number (in hours, default to 1),
        "priority": "Low", "Medium", or "High"
      }
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);

    let rawText = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Voice Task Error:", error);
    throw new Error("Failed to parse voice input.");
  }
}

module.exports = {
  generateTaskStrategy,
  breakDownTask,
  parseVoiceToTask,
};
