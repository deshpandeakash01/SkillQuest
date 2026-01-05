const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { getMe } = require("../controllers/profileController");

// Get logged-in user's profile
router.get("/me", auth, getMe);

// Delete Profile
const { deleteAccount } = require("../controllers/profileController");
router.delete("/", auth, deleteAccount);

module.exports = router;

