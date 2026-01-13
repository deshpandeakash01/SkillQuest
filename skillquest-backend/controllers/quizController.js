const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Skill = require("../models/Skill");
const aiService = require("../utils/aiService");

/* ===========================
   CREATE QUIZ
   =========================== */
exports.createQuiz = async (req, res) => {
    try {
        const { title, questions } = req.body;

        const newQuiz = await Quiz.create({
            teacher: req.user.id,
            title,
            questions
        });

        res.status(201).json({ msg: "Quiz created", quizId: newQuiz._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

/* ===========================
   GET QUIZ (Student View)
   =========================== */
/* ===========================
   GET QUIZ (Student View - Dynamic Session)
   =========================== */

exports.getQuiz = async (req, res) => {
    try {
        console.log("GET QUIZ: Request for ID:", req.params.id);
        const quiz = await Quiz.findById(req.params.id).populate("teacher", "name");
        if (!quiz) {
            console.log("GET QUIZ: Quiz not found in DB");
            return res.status(404).json({ msg: "Quiz not found" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            console.log("GET QUIZ: User not found");
            return res.status(404).json({ msg: "User not found" });
        }

        console.log("GET QUIZ: Found Quiz:", quiz.title);

        const skill = await Skill.findOne({ quizId: quiz._id });
        if (!skill) {
            console.log("GET QUIZ: Skill link not found for quizId:", quiz._id);
            return res.status(404).json({ msg: "Skill not found for this quiz" });
        }

        console.log("GET QUIZ: Linked Skill:", skill.name);

        console.log("GET QUIZ: Reached History Check");

        if (!user.quizHistory) {
            console.log("GET QUIZ: quizHistory missing, initializing.");
            user.quizHistory = new Map();
        }

        // Retrieve History
        let history;
        if (user.quizHistory instanceof Map) {
            history = user.quizHistory.get(skill.name);
        } else {
            // Fallback if somehow not a Map (legacy data?)
            console.log("GET QUIZ: quizHistory is not a Map!", user.quizHistory);
            // Force reset
            user.quizHistory = new Map();
            history = undefined;
        }

        if (!history) {
            console.log("GET QUIZ: New history entry for skill");
            history = { attempts: 0, bestScore: 0, currentQuestions: [] };
        }

        // Check Limit
        if (history.attempts >= 5) {
            return res.status(403).json({
                msg: "Max 5 Attempts Reached. Your best score is " + history.bestScore
            });
        }

        // Calculate Difficulty for this Attempt
        // 0->Medium, 1->Hard, 2->Expert... (Customize progression)
        const levels = ["Medium", "Hard", "Expert", "Master", "Legendary"];
        const difficulty = levels[history.attempts] || "Legendary";

        console.log("GET QUIZ: Generating questions...");
        // Generate NEW Questions
        const generated = await aiService.generateQuiz(skill.name, difficulty, quiz.questions.length || 5);
        console.log("GET QUIZ: Questions generated");

        // Store Session in User DB (currentQuestions)
        history.currentQuestions = generated.questions;
        // Don't increment attempt count yet, do it on submit? 
        // Or do it on start? Usually start = attempt.
        // Let's do it on submit to avoid counting abandoned starts, 
        // BUT user asked for "new questions each attempt", implies fetch = attempt.
        // Let's increment on SUBMIT so they don't burn attempts by refreshing.
        // But then they could refresh until they get easy questions?
        // With "AI Randomized", assume consistent difficulty. 
        // We will just update Current Questions here.

        user.quizHistory.set(skill.name, history);
        await user.save();

        // Return Sanitized (No Correct Answers)
        const sanitizedQuestions = generated.questions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            type: q.type
        }));

        res.json({
            title: `${generated.title} (Attempt ${history.attempts + 1}/5)`,
            teacher: quiz.teacher.name,
            questions: sanitizedQuestions,
            attempts: history.attempts,
            maxAttempts: 5
        });

    } catch (err) {
        console.error("GET QUIZ ERROR:", err);
        res.status(500).json({ msg: "Server error calling AI" });
    }
};

/* ===========================
   SUBMIT QUIZ
   =========================== */

exports.submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body; // { index: [choiceIndex] }

        // We need to find the skill associated with this quiz first to lookup history
        // The URL params has :id which is the QUIZ ID.
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

        const skill = await Skill.findOne({ quizId: quiz._id });
        if (!skill) return res.status(404).json({ msg: "Skill link error" });

        const user = await User.findById(req.user.id);
        let history = user.quizHistory.get(skill.name);

        if (!history || !history.currentQuestions || history.currentQuestions.length === 0) {
            return res.status(400).json({ msg: "No active quiz session found. Please start the quiz first." });
        }

        const sessionQuestions = history.currentQuestions;
        let score = 0;
        const results = [];

        sessionQuestions.forEach((q, index) => {
            const userAns = answers[index] || [];
            // Mock AI services usually set ans [0] as correct in array, 
            // but for safety in future, checking stored correctAnswers
            // In our mock aiService, correctAnswers is always [0]
            const correctAns = q.correctAnswers.sort().toString();

            // userAns is array of INDICES from frontend
            const submittedAns = userAns.sort().toString();

            const isCorrect = correctAns === submittedAns;
            if (isCorrect) score++;

            results.push({
                question: q.questionText,
                isCorrect,
                correctAnswers: q.correctAnswers.map(i => q.options[i])
            });
        });

        const total = sessionQuestions.length;
        const percentage = (score / total) * 100;

        // UPDATE HISTORY
        history.attempts += 1;
        if (percentage > history.bestScore) {
            history.bestScore = percentage;
        }

        // Finalize
        const passed = history.bestScore >= 60; // Pass if BEST score is good enough

        if (passed) {
            if (!user.skillsCompleted.includes(skill.name)) {
                user.skillsCompleted.push(skill.name);
            }
        }

        // Clear current session questions to prevent re-submission of same easy set?
        // Or keep them for review? 
        // Better to clear or mark as done. For now, we just save.
        // If they call getQuiz again, they get new questions (and attempt++ handled there? No, attempts handled here)

        user.quizHistory.set(skill.name, history);
        await user.save();

        res.json({
            score,
            total,
            percentage,
            passed, // Overall status based on best score
            bestScore: history.bestScore,
            attempts: history.attempts,
            results,
            maxAttempts: 5,
            remainingAttempts: 5 - history.attempts
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
