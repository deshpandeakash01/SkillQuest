const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getMe } = require("../controllers/profileController");

// Get logged-in user's profile
router.get("/me", auth, getMe);

// Update Profile (Bio, Social)
const { updateProfile, uploadProfilePicture, deleteProfilePicture } = require("../controllers/profileController");
const upload = require("../middleware/uploadMiddleware");

router.put("/", auth, updateProfile);

// Avatar Upload
router.post("/avatar", auth, upload.single("avatar"), uploadProfilePicture);
router.delete("/avatar", auth, deleteProfilePicture);

// Delete Profile
const { deleteAccount } = require("../controllers/profileController");
router.delete("/", auth, deleteAccount);

module.exports = router;

