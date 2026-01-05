const mongoose = require("mongoose");

/* =====================
   CREDIT SUB-SCHEMA
   ===================== */
const creditSchema = new mongoose.Schema(
  {
    available: {
      type: Number,
      default: 0
    },
    earned: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

/* =====================
   USER SCHEMA
   ===================== */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    credits: {
      type: creditSchema,
      default: () => ({})
    },

    skillsTeach: {
      type: [String],
      default: []
    },

    skillsLearning: {
      type: [String],
      default: []
    },

    skillsInterested: {
      type: [String],
      default: []
    },

    skillsCompleted: {
      type: [String], // Array of Skill Names that are fully mastered/passed
      default: []
    },

    // Track detailed quiz progress
    quizHistory: {
      type: Map,
      of: new mongoose.Schema({
        attempts: { type: Number, default: 0 },
        bestScore: { type: Number, default: 0 },
        currentQuestions: { type: Array, default: [] } // Store generated questions for grading
      }, { _id: false }),
      default: {}
    },

    activity: {
      type: [String],
      default: []
    },

    rating: {
      type: Number,
      default: 0
    },

    ratingCount: {
      type: Number,
      default: 0
    },

    bio: {
      type: String,
      default: "Learning and sharing skills on SkillQuest."
    },

    profilePicture: {
      type: String,
      default: ""
    },

    socialLinks: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
