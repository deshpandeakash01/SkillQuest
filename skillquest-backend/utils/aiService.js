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

    const descriptors = ["Key", "Hidden", "Core", "Abstract", "Fundamental", "Complex"];
    const concepts = ["Pattern", "Syntax", "Function", "Module", "Architecture", "Logic"];

    for (let i = 1; i <= numQuestions; i++) {
        // Randomize content to simulate "New Questions each time"
        const randDesc = descriptors[Math.floor(Math.random() * descriptors.length)];
        const randConcept = concepts[Math.floor(Math.random() * concepts.length)];
        const randId = Math.floor(Math.random() * 1000);

        questions.push({
            // _id: randId, // Removed to avoid CastError (Mongoose expects ObjectId)
            questionText: `[Attempt: ${currentDiff}] What represents the ${randDesc} ${randConcept} in ${topic}?`,
            options: [
                `The correct answer for ${randConcept}`,
                `A misleading distractor`,
                `Completely wrong option`,
                `Another wrong choice`
            ],
            // Randomize correct answer index
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
