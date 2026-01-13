// Mock AI Service
// In a real app, this would be an OpenAI / Anthropic API call

// -------------------------------------------------------------
// HELPER: Generate Mock Quiz
// -------------------------------------------------------------
exports.generateQuiz = async (topic, baseDifficulty, numQuestions) => {
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 600));

    const questions = [];
    const mainTopic = topic.split(" ")[0] || "Topic";
    const diffLabel = baseDifficulty || "Medium";

    // Realistic-looking templates for Technical/General topics
    // We vary the structure to look less robotic
    const templates = [
        {
            q: "What is the primary purpose of {topic} in a production environment?",
            correct: "To optimize performance and maintainability",
            wrong: ["To increase code complexity", "To bypass security protocols", "To replace all legacy systems"]
        },
        {
            q: "Which of the following is a key characteristic of {topic}?",
            correct: "It enables modular and scalable architecture",
            wrong: ["It is only used for small scripts", "It requires manual memory management", "It is incompatible with modern frameworks"]
        },
        {
            q: "When debugging an issue related to {topic}, what should be checked first?",
            correct: "Configuration settings and initial state",
            wrong: ["The hardware manufacturer", "The internet service provider", "The color scheme of the IDE"]
        },
        {
            q: "In the context of {topic}, what does the term 'Latency' typically refer to?",
            correct: " The time delay between a request and a response", // Contextualized
            wrong: ["The bandwidth capacity", "The size of the database", "The number of concurrent users"]
        },
        {
            q: "Which best practice should be followed when implementing {topic}?",
            correct: " consistent naming conventions and error handling",
            wrong: ["Ignoring edge cases", "Hardcoding all values", "Skipping documentation"]
        }
    ];

    for (let i = 0; i < numQuestions; i++) {
        // Cycle through templates or pick random
        const tpl = templates[i % templates.length];

        // Replace placeholder
        const questionText = tpl.q.replace("{topic}", mainTopic);

        // Prepare options: Correct + 3 Wrong
        let options = [tpl.correct, ...tpl.wrong];

        // Shuffle options
        options = options.sort(() => Math.random() - 0.5);

        // Find index of correct answer
        const correctIndex = options.indexOf(tpl.correct);

        questions.push({
            questionText: questionText,
            options: options,
            correctAnswers: [correctIndex], // Single choice for now
            type: "single"
        });
    }

    return {
        title: `Quiz: ${topic} (${diffLabel})`,
        questions
    };
};

// -------------------------------------------------------------
// HELPER: Generate Mock Notes
// -------------------------------------------------------------
exports.generateLessonPlan = async (topic, outcome) => {
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 800));

    const date = new Date().toLocaleDateString();

    // Markdown Structured Notes
    const notes = `
# 📘 Class Notes: ${topic}
**Generated on:** ${date}
**Focus:** ${outcome || "General Mastery"}

---

## 🚀 1. Executive Summary
This session explored the fundamental principles of **${topic}**. The primary goal was to understand how to leverage this skill to achieve *${outcome}*. We covered the theoretical underpinnings as well as practical, real-world applications.

> **Key Takeaway:** Mastery of ${topic} relies not just on memorizing syntax or rules, but on understanding the underlying patterns and best practices.

---

## 💡 2. Core Concepts
Here are the critical pillars discussed in this class:

### A. The Foundation
- **Definition:** ${topic} is a critical component in its field, allowing for efficient problem-solving.
- **Why it matters:** Without understanding this, advanced implementation becomes prone to errors.

### B. Methodology
- **Step 1:** Initialization and Setup.
- **Step 2:** Execution of standard patterns.
- **Step 3:** Optimization and Refactoring.

---

## 🔍 3. Deep Dive Analysis
We examined a common scenario where ${topic} is applied. 

*   **The Challenge:** Handling high-load or complex states often leads to performance bottlenecks.
*   **The Solution:** Applying specific design patterns associated with ${topic} reduces overhead by 30-40%.
*   **Common Pitfall:** Beginners often overlook *error handling*, which leads to silent failures.

---

## 🛠️ 4. Practical Application & Code/Steps
To implement what we learned, follow this checklist:

1.  [ ] Define your constraints clear.
2.  [ ] Set up your environment for ${topic}.
3.  [ ] Run the baseline test.
4.  [ ] Monitor the output and adjust parameters.

\`\`\`javascript
// Example Pseudo-code Pattern for ${topic}
function applySkill() {
    const state = init(${topic});
    if (state.isValid()) {
       return execute(state);
    }
    return handleFailure(state);
}
\`\`\`

---

## 📚 5. Recommended Resources
To further your understanding, check out these trusted sources:

*   [Official Documentation for ${topic}](https://example.com/docs)
*   [GeeksForGeeks: Advanced ${topic} Guide](https://geeksforgeeks.org)
*   [Wikipedia: History of ${topic}](https://wikipedia.org)
*   [YouTube: Crash Course on ${topic}](https://youtube.com)

---

*Note: These notes were AI-generated based on the class metadata.*
`;

    return notes;
};
