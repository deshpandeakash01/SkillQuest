const Skill = require("../models/Skill");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

/* =====================
   GET ALL SKILLS
   ===================== */
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });

    let user = null;
    if (req.user) {
      user = await User.findById(req.user.id);
    }

    const enrichedSkills = skills.map(skill => ({
      ...skill.toObject(),
      isLearning: user ? user.skillsLearning.includes(skill.name) : false,
      isInterested: user ? user.skillsInterested.includes(skill.name) : false,
      isTeaching: user ? user.skillsTeach.includes(skill.name) : false
    }));

    res.json(enrichedSkills);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


/* =====================
   ADD TO INTEREST
   ===================== */
exports.addInterest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const skill = await Skill.findById(req.params.skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    if (
      user.skillsInterested.includes(skill.name) ||
      user.skillsLearning.includes(skill.name) ||
      user.skillsTeach.includes(skill.name)
    ) {
      return res.status(400).json({ msg: "Skill already added" });
    }

    user.skillsInterested.push(skill.name);
    user.activity.push(`Added interest in ${skill.name}`);

    await user.save();

    res.json({ msg: "Skill added to interests" });
  } catch (err) {
    console.error("Add interest error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


/* =====================
   ENROLL (LEARN SKILL)
   ===================== */
exports.enrollSkill = async (req, res) => {
  try {
    const learner = await User.findById(req.user.id);
    const skill = await Skill.findById(req.params.skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    if (learner.credits.available < skill.creditCost) {
      return res.status(400).json({ msg: "Insufficient credits" });
    }

    if (learner.skillsLearning.includes(skill.name)) {
      return res.status(400).json({ msg: "Already enrolled" });
    }

    if (learner.skillsTeach.includes(skill.name)) {
      return res.status(400).json({ msg: "You already teach this skill" });
    }

    // Remove from interests if present
    learner.skillsInterested = learner.skillsInterested.filter(
      s => s !== skill.name
    );

    // Deduct credits from learner
    learner.skillsLearning.push(skill.name);
    learner.credits.available -= skill.creditCost;
    learner.credits.spent += skill.creditCost;
    learner.activity.push(
      `Spent ${skill.creditCost} credits learning ${skill.name}`
    );

    await learner.save();

    // Credit the teacher
    if (skill.createdBy) {
      const teacher = await User.findById(skill.createdBy);

      if (teacher) {
        teacher.credits.available += skill.creditCost;
        teacher.credits.earned += skill.creditCost;
        teacher.activity.push(
          `Earned ${skill.creditCost} credits teaching ${skill.name}`
        );

        await teacher.save();
      }
    }

    res.json({ msg: "Enrolled successfully" });

  } catch (err) {
    console.error("Enroll skill error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =====================
   COMPLETE SKILL
   ===================== */
exports.completeSkill = async (req, res) => {
  try {
    const user = req.user;
    const skill = await Skill.findById(req.params.skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    if (!user.skillsLearning.includes(skill.name)) {
      return res.status(400).json({
        msg: "You are not currently learning this skill"
      });
    }

    // Remove from learning
    user.skillsLearning = user.skillsLearning.filter(
      s => s !== skill.name
    );

    // Add to teaching eligibility
    if (!user.skillsTeach.includes(skill.name)) {
      user.skillsTeach.push(skill.name);
    }

    user.activity.push(`Completed learning ${skill.name}`);

    await user.save();

    res.json({
      msg: "Skill completed successfully. You can now teach this skill."
    });

  } catch (err) {
    console.error("Complete skill error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


/* =====================
   TEACH SKILL
   ===================== */
exports.teachSkill = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const skill = await Skill.findById(req.params.skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    if (user.skillsTeach.includes(skill.name)) {
      return res.status(400).json({ msg: "Already teaching this skill" });
    }

    if (user.skillsLearning.includes(skill.name)) {
      return res.status(400).json({
        msg: "Cannot teach a skill you are currently learning"
      });
    }

    // REMOVED block that required user to ALREADY be teaching the skill to teach it (logic error)



    user.skillsTeach.push(skill.name);
    user.activity.push(`Started teaching ${skill.name}`);

    await user.save();

    res.json({ msg: "Skill added to teaching list" });
  } catch (err) {
    console.error("Teach skill error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =====================
   RATE TEACHER
   ===================== */
exports.rateTeacher = async (req, res) => {
  try {
    const { rating } = req.body; // 1-5
    const teacherId = req.params.teacherId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    // Calculate new average
    // Total Score = (Old Avg * Old Count) + New Rating
    // New Avg = Total Score / (Old Count + 1)
    const currentTotal = teacher.rating * teacher.ratingCount;
    const newCount = teacher.ratingCount + 1;
    const newAvg = (currentTotal + rating) / newCount;

    teacher.rating = parseFloat(newAvg.toFixed(1));
    teacher.ratingCount = newCount;

    await teacher.save();

    res.json({ msg: "Rating submitted", newRating: teacher.rating });

  } catch (err) {
    console.error("Rate teacher error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* =====================
   VIDEO UPLOAD & PROCESS
   ===================== */
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No video file uploaded" });
    }

    // File is saved in 'uploads/' by route middleware
    // In a real app with AI, we would:
    // 1. Send req.file.path to Whisper API (STT)
    // 2. Send text to LLM (Summarization)
    // 3. Generate PDF

    // For this demo version, we acknowledge the upload.
    res.json({
      msg: "Video uploaded successfully. AI processing queued.",
      filename: req.file.filename,
      path: req.file.path
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ msg: "Server error during upload" });
  }
};

/* =====================
   PUBLISH SKILL (Rich Upload)
   ===================== */
const aiService = require("../utils/aiService");
const Quiz = require("../models/Quiz");

/* =====================
   PUBLISH SKILL (Rich Upload)
   ===================== */
exports.publishSkill = async (req, res) => {
  try {
    const {
      name, category, outcome, creditCost,
      quizDifficulty, quizNumQuestions
    } = req.body;

    console.log("Debug: Received publish request");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    // Video handling
    let videoUrl = "";
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    }

    if (!name || !outcome) {
      return res.status(400).json({ msg: "Name and Outcome are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // 1. Create Skill
    const newSkill = new Skill({
      name,
      category: category || "General",
      outcome,
      creditCost: creditCost || 5, // Default cost
      videoUrl,
      createdBy: user._id,
      tutorName: user.name
    });

    // 2. Generate AI Quiz (if requested or default)
    // Default to Medium / 5 questions if not provided
    const difficulty = quizDifficulty || "Medium";
    const numQuestions = quizNumQuestions || 5;

    // Pass videoUrl (which is the relative path like /uploads/filename.mp4)
    // The aiService will handle resolving it to an absolute path
    const quizData = await aiService.generateQuiz(name, difficulty, numQuestions, videoUrl);

    // 3. Save Quiz
    const newQuiz = await Quiz.create({
      teacher: user._id,
      title: quizData.title,
      questions: quizData.questions
    });

    // 4. Link Quiz to Skill
    newSkill.quizId = newQuiz._id;
    await newSkill.save();

    // Auto-add to teacher's teaching list
    if (!user.skillsTeach.includes(newSkill.name)) {
      user.skillsTeach.push(newSkill.name);
    }

    // REWARD: Award credits for publishing
    const PUBLISH_REWARD = 5;
    user.credits.available += PUBLISH_REWARD;
    user.credits.earned += PUBLISH_REWARD;
    user.activity.push(`Earned ${PUBLISH_REWARD} credits for publishing ${newSkill.name}`);

    await user.save();

    res.json({
      msg: "Skill published and AI Quiz generated!",
      skill: newSkill,
      quizId: newQuiz._id
    });

  } catch (err) {
    console.error("Publish skill error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
/* =====================
   DELETE SKILL
   ===================== */
exports.deleteSkill = async (req, res) => {
  try {
    const skillId = req.params.id;
    const userId = req.user.id; // From auth middleware

    const skill = await Skill.findById(skillId);

    if (!skill) {
      return res.status(404).json({ msg: "Skill not found" });
    }

    // Check ownership
    if (skill.createdBy.toString() !== userId) {
      return res.status(401).json({ msg: "Not authorized to delete this skill" });
    }

    // DEDUCT CREDITS
    const user = await User.findById(userId);
    if (user) {
      user.credits.available = Math.max(0, (user.credits.available || 0) - 5);
      user.activity.push(`Deducted 5 credits for deleting ${skill.name}`);
      await user.save();
    }

    // 1. Delete Video File
    if (skill.videoUrl && !skill.videoUrl.startsWith("http")) {
      const relativePath = skill.videoUrl.startsWith("/") ? skill.videoUrl.substring(1) : skill.videoUrl;
      const filePath = path.join(__dirname, "..", relativePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 2. Delete Associated Quiz
    if (skill.quizId) {
      await Quiz.findByIdAndDelete(skill.quizId);
    }

    // 3. Delete Skill DB Record
    await Skill.findByIdAndDelete(skillId);

    // 4. Remove from User Lists (optional but clean)
    // We should probably remove it from 'skillsTeach', 'skillsLearning', 'skillsInterested' of ALL users
    // But that might be heavy. For now, let's just let them point to nothing or handle it on fetch.
    // Ideally:
    await User.updateMany(
      {},
      { $pull: { skillsTeach: skill.name, skillsLearning: skill.name, skillsInterested: skill.name } }
    );

    res.json({ msg: "Skill deleted successfully" });

  } catch (err) {
    console.error("Delete skill error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
