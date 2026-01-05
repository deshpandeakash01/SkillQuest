const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    outcome: {
      type: String, // What student learns
      required: true,
      default: "General Knowledge"
    },

    category: {
      type: String,
      default: "General",
      enum: ["Technical", "Music", "Art", "Business", "Language", "Health", "General"]
    },

    videoUrl: {
      type: String, // Path to uploaded video
      default: ""
    },

    tutorName: {
      type: String, // Cached for search
      default: ""
    },

    creditCost: {
      type: Number,
      default: 5
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
