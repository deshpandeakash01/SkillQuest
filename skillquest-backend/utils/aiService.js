// Google Gemini Service with Fallback
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("fs");
const path = require("path");

// Initialize Gemini (Safe Initialization)
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let fileManager = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    fileManager = new GoogleAIFileManager(apiKey);
} else {
    console.warn("⚠️ GEMINI_API_KEY not found. AI features will run in MOCK mode.");
}

// -------------------------------------------------------------
// HELPER: Upload File to Gemini (with Retry/Safety)
// -------------------------------------------------------------
async function uploadToGemini(filePath, mimeType) {
    try {
        if (!fileManager) throw new Error("No API Key");

        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: path.basename(filePath),
        });

        const file = uploadResult.file;
        // Wait for processing
        let processedFile = await fileManager.getFile(file.name);
        while (processedFile.state === "PROCESSING") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            processedFile = await fileManager.getFile(file.name);
        }

        if (processedFile.state === "FAILED") {
            throw new Error("Video processing failed by Google AI");
        }

        return processedFile;
    } catch (err) {
        console.error("Gemini Upload Error:", err.message);
        return null; // Signal failure to fall back
    }
}

// -------------------------------------------------------------
// MOCK GENERATORS (Fallback Protection)
// -------------------------------------------------------------
async function generateMockQuiz(topic, baseDifficulty, numQuestions) {
    await new Promise((r) => setTimeout(r, 600));
    const mainTopic = topic.split(" ")[0] || "Topic";
    const questions = [];
    const templates = [
        {
            q: "What is the primary purpose of {topic} in a production environment?",
            correct: "To optimize performance and maintainability",
            wrong: ["To increase code complexity", "To bypass security protocols", "To replace all legacy systems"],
        },
        {
            q: "Which of the following is a key characteristic of {topic}?",
            correct: "It enables modular and scalable architecture",
            wrong: ["It is only used for small scripts", "It requires manual memory management", "It is incompatible with modern frameworks"],
        },
        {
            q: "When debugging an issue related to {topic}, what should be checked first?",
            correct: "Configuration settings and initial state",
            wrong: ["The hardware manufacturer", "The internet service provider", "The color scheme of the IDE"],
        },
        {
            q: "In the context of {topic}, what does the term 'Latency' typically refer to?",
            correct: "The time delay between a request and a response",
            wrong: ["The bandwidth capacity", "The size of the database", "The number of concurrent users"],
        },
        {
            q: "Which best practice should be followed when implementing {topic}?",
            correct: "Consistent naming conventions and error handling",
            wrong: ["Ignoring edge cases", "Hardcoding all values", "Skipping documentation"],
        },
    ];

    for (let i = 0; i < numQuestions; i++) {
        const tpl = templates[i % templates.length];
        const questionText = tpl.q.replace("{topic}", mainTopic);
        let options = [tpl.correct, ...tpl.wrong];
        options = options.sort(() => Math.random() - 0.5);
        questions.push({
            questionText: questionText,
            options: options,
            correctAnswers: [options.indexOf(tpl.correct)],
            type: "single",
        });
    }

    return { title: `Quiz: ${topic} (Mock)`, questions };
}

async function generateMockNotes(topic, outcome) {
    await new Promise((r) => setTimeout(r, 800));
    const date = new Date().toLocaleDateString();
    return `
# 📘 Class Notes: ${topic}
**Generated on:** ${date}
**Focus:** ${outcome || "General Mastery"}

---

## 🚀 1. Executive Summary
This session explored the fundamental principles of **${topic}**. The primary goal was to understand how to leverage this skill to achieve *${outcome}*. 

> **Key Takeaway:** Mastery of ${topic} relies not just on memorizing syntax, but on understanding underlying patterns.

## 💡 2. Core Concepts
*   **Definition:** ${topic} is a critical component for efficient problem-solving.
*   **Why it matters:** Essential for advanced implementations.

## 🛠️ 3. Practical Steps
1.  [ ] Define constraints.
2.  [ ] Set up environment for ${topic}.
3.  [ ] Run baseline tests.

## 📚 4. Resources
*   [Official Docs](https://example.com)
*   [Wikipedia](https://wikipedia.org)

*Note: These are mock notes generated because AI processing was unavailable.*
`;
}

// -------------------------------------------------------------
// EXPORTS
// -------------------------------------------------------------

exports.generateQuiz = async (topic, baseDifficulty, numQuestions, videoPath = null) => {
    try {
        // 1. Check for API Key
        if (!genAI || !apiKey) throw new Error("No API Key");

        // 2. Upload Video (if provided)
        let promptContext = `Topic: "${topic}". Difficulty: ${baseDifficulty}.`;
        let parts = [];

        if (videoPath) {
            // Resolve absolute path if it is relative
            const absolutePath = path.isAbsolute(videoPath)
                ? videoPath
                : path.join(__dirname, "..", videoPath);

            if (fs.existsSync(absolutePath)) {
                const upload = await uploadToGemini(absolutePath, "video/mp4"); // Assuming MP4
                if (upload) {
                    parts.push({
                        fileData: {
                            mimeType: upload.mimeType,
                            fileUri: upload.uri
                        }
                    });
                    promptContext += " Based STRICTLY on the content of the attached video.";
                } else {
                    console.log("Video upload failed, falling back to text-only prompt");
                }
            }
        }

        // 3. Construct Prompt
        const prompt = `
      ${promptContext}
      Generate a quiz with ${numQuestions} questions.
      Return valid JSON with this structure:
      {
        "title": "Quiz Title",
        "questions": [
          {
            "questionText": "Question string",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswers": [0] // Index of correct option
          }
        ]
      }
      Do not include markdown code blocks like \`\`\`json. Just the raw JSON string.
    `;

        parts.push({ text: prompt });

        // 4. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(parts);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const json = JSON.parse(text);
        return json;

    } catch (err) {
        console.error("⚠️ Real Quiz Generation Failed:", err.message);
        console.log("🔄 Falling back to Mock Quiz...");
        return generateMockQuiz(topic, baseDifficulty, numQuestions);
    }
};

exports.generateLessonPlan = async (topic, outcome, videoPath = null) => {
    try {
        if (!genAI || !apiKey) throw new Error("No API Key");

        let promptContext = `Topic: "${topic}". Learning Outcome: "${outcome}".`;
        let parts = [];

        if (videoPath) {
            const absolutePath = path.isAbsolute(videoPath)
                ? videoPath
                : path.join(__dirname, "..", videoPath);

            if (fs.existsSync(absolutePath)) {
                const upload = await uploadToGemini(absolutePath, "video/mp4");
                if (upload) {
                    parts.push({
                        fileData: {
                            mimeType: upload.mimeType,
                            fileUri: upload.uri
                        }
                    });
                    promptContext += " Analyze the video thoroughly.";
                }
            }
        }

        const prompt = `
      ${promptContext}
      Generate detailed, structural, and professional markdown class notes.
      Include:
      1. Executive Summary
      2. Core Concepts (Deep dive into what was actually discussed/shown)
      3. Practical Application (Steps or Code examples if relevant to the video)
      4. Recommended Resources (Real URL links to Wikipedia, YouTube, Documentation suitable for the topic)
      
      Format strictly as Markdown.
    `;

        parts.push({ text: prompt });

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(parts);
        const response = await result.response;
        return response.text();

    } catch (err) {
        console.error("⚠️ Real Note Generation Failed:", err.message);
        console.log("🔄 Falling back to Mock Notes...");
        return generateMockNotes(topic, outcome);
    }
};

