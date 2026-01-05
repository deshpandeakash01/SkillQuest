const User = require("../models/User");

// Delete Account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ msg: "User deleted" });
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
    const { bio, socialLinks } = req.body; // socialLinks is { github: "url", ... }
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Update Bio
    if (bio !== undefined) user.bio = bio;

    // Update Social Links & Calc Bonus
    let bonusCredits = 0;
    if (socialLinks && typeof socialLinks === 'object') {
      // Initialize if null
      if (!user.socialLinks) user.socialLinks = {};

      // We need to detect NEW links to give credit.
      // But since we are using Mixed/Object, user.socialLinks is just an object.
      // We iterate the incoming keys.

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
          delete user.socialLinks[platform];
        }
      }

      // Mark as modified because Mixed types aren't always auto-detected
      user.markModified('socialLinks');
    }

    // Apply Bonus
    if (bonusCredits > 0) {
      if (!user.credits) user.credits = { available: 0, earned: 0, spent: 0 };
      user.credits.earned = (user.credits.earned || 0) + bonusCredits;
      user.credits.available = (user.credits.available || 0) + bonusCredits;
      user.markModified('credits');
    }

    await user.save();

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
    console.error(err);
    res.status(500).json({ msg: "Server error" });
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
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
