// Resource Cleanup Imports
const User = require("../models/User");
const Skill = require("../models/Skill");
const Quiz = require("../models/Quiz");
const path = require("path");
const fs = require("fs");

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find Skills created by user
    const skills = await Skill.find({ createdBy: userId });

    // 2. Delete Video Files
    for (const skill of skills) {
      if (skill.videoUrl && !skill.videoUrl.startsWith("http")) { // Only delete local files
        // Remove leading slash if present to ensure path.join works relatively
        const relativePath = skill.videoUrl.startsWith("/") ? skill.videoUrl.substring(1) : skill.videoUrl;
        const filePath = path.join(__dirname, "..", relativePath);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 3. Delete DB Records
    await Skill.deleteMany({ createdBy: userId });
    await Quiz.deleteMany({ teacher: userId });

    // 4. Delete User
    await User.findByIdAndDelete(userId);

    res.json({ msg: "User and all associated content deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* ===========================
   UPDATE PROFILE (Bio + Social)
   =========================== */
exports.updateProfile = async (req, res) => {
  try {
    console.log("UPDATE PROFILE REQUEST:", req.body);
    const { bio, socialLinks } = req.body; // socialLinks is { github: "url", ... }
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Update Bio
    if (bio !== undefined) user.bio = bio;

    // Update Social Links & Calc Bonus
    let bonusCredits = 0;
    if (socialLinks && typeof socialLinks === 'object') {
      console.log("Social Links received:", socialLinks);
      // Initialize if null or not an object
      if (!user.socialLinks || typeof user.socialLinks !== 'object') {
        user.socialLinks = {};
      }

      // We iteration the incoming keys.
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url && url.trim() !== "") {
          // Check if this platform was already present and had a value
          if (!user.socialLinks[platform]) {
            bonusCredits++;
          }
          // Update value
          user.socialLinks[platform] = url.trim();
        } else {
          // remove if empty
          if (user.socialLinks[platform]) {
            delete user.socialLinks[platform];
          }
        }
      }

      // Mark as modified because Mixed types aren't always auto-detected
      user.markModified('socialLinks');
    }

    // Apply Bonus
    if (bonusCredits > 0) {
      if (!user.credits) user.credits = {};
      // Ensure sub-properties exist
      if (typeof user.credits.earned !== 'number') user.credits.earned = 0;
      if (typeof user.credits.available !== 'number') user.credits.available = 0;

      user.credits.earned += bonusCredits;
      user.credits.available += bonusCredits;
      user.markModified('credits');
    }

    await user.save();
    console.log("Profile Saved Successfully");

    res.json({
      msg: "Profile updated",
      bonusEarned: bonusCredits,
      user: {
        bio: user.bio,
        socialLinks: user.socialLinks,
        credits: user.credits
      }
    });

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/* ===========================
   UPLOAD PROFILE PICTURE
   =========================== */
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No image uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Save relative path or full URL
    // Assuming static serve from /uploads
    const imageUrl = `/uploads/${req.file.filename}`;

    user.profilePicture = imageUrl;
    await user.save();

    res.json({ msg: "Picture updated", profilePicture: imageUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ===========================
   DELETE PROFILE PICTURE
   =========================== */
exports.deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.profilePicture = ""; // Clear string
    await user.save();

    res.json({ msg: "Picture removed", profilePicture: "" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ===========================
   GET MY PROFILE
   =========================== */
exports.getMe = async (req, res) => {
  try {
    // Middleware already fetches user
    if (!req.user) {
      console.error("GET ME: No user in req");
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(req.user);
  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ msg: "Server error", error: err.message, stack: err.stack });
  }
};
