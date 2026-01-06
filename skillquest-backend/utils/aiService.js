// Mock AI Service
// In a real app, this would be an OpenAI / Anthropic API call

exports.generateQuiz = async (topic, baseDifficulty, numQuestions) => {
    // Simulate AI processing
    // await new Promise(r => setTimeout(r, 500));

    const questions = [];

    // Difficulty levels
    const levels = ["Basic", "Intermediate", "Advanced", "Expert", "Master"];
    // Map baseDifficulty to an index roughly
    let diffIndex = 0; // Default Basic
    if (baseDifficulty === "Medium") diffIndex = 1;
    if (baseDifficulty === "Hard") diffIndex = 2;

    // We can pass an optional "attempt" param? No, logic will be handled by controller calling this with different "difficulty" string
    // Actually, controller will pass the Calculated Difficulty.

    const currentDiff = baseDifficulty;

    // Generate semi-realistic questions based on topic
    // Simple mock logic to make it look like "AI"
    const topicWords = topic.split(" ");
    const mainTopic = topicWords[0] || "General";

    // Templates for various types of questions
    const questionTemplates = [
        "What is the primary function of {topic} in modern development?",
        "Which of the following best describes the core concept of {topic}?",
        "When implementing {topic}, what is the most critical factor to consider?",
        "In the context of {topic}, what does the term '{concept}' refer to?",
        "How does {topic} handle async operations compared to traditional methods?",
        "What is a common pitfall when working with {topic} for beginners?"
    ];

    // Dynamic 'concepts' based on topic to make it look real
    const concepts = ["Abstraction", "Latency", "Encapsulation", "State Management", "Recursion", "Scalability", "Syntax", "Compilation"];

    for (let i = 1; i <= numQuestions; i++) {
        // Pick a random template
        const tpl = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
        const concept = concepts[Math.floor(Math.random() * concepts.length)];

        // Construct question text
        let qText = tpl.replace("{topic}", mainTopic).replace("{concept}", concept);

        // Add difficulty marker (User likes to see attempts/difficulty)
        qText = `[${currentDiff} Level] ${qText}`;

        questions.push({
            questionText: qText,
            options: [
                `The standard approach defined by ${mainTopic} documentation`, // Correct-ish sounding
                `A deprecated method that is no longer used`, // Distractor
                `An unrelated concept from a different language`, // Wrong
                `Only applicable in server-side environments` // Wrong
            ],
            // Always index 0 correct for this mock
            correctAnswers: [0],
            type: "single"
        });
    }

    // Shuffle options in a real app
    // output:
    return {
        title: `Quiz: ${topic} (${currentDiff} Level)`,
        questions
    };
};
