const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const videoController = require("../controllers/videoController");
const certificateController = require("../controllers/certificateController");
const quizController = require("../controllers/quizController");
const profileController = require("../controllers/profileController");
const skillController = require("../controllers/skillController");
const multer = require("multer");
const path = require("path");

/* ===========================
   MULTER CONFIG
   =========================== */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/* ===========================
   ROUTES
   =========================== */

// 1. Upload Video (Live Record or File)
router.post("/video/upload", authMiddleware, upload.single("video"), videoController.uploadVideo);

// 2. Generate AI Notes
router.post("/video/notes", authMiddleware, videoController.generateNotes);

// 3. Issue Certificate
router.post("/certificate/issue", authMiddleware, certificateController.issueCertificate);

// 4. Quiz System
router.post("/quiz/create", authMiddleware, quizController.createQuiz);
router.get("/quiz/:id", authMiddleware, quizController.getQuiz);
router.post("/quiz/:id/submit", authMiddleware, quizController.submitQuiz);

// 4.5. Publish Skill (Rich Upload)
router.post("/skills/publish", authMiddleware, upload.single("video"), skillController.publishSkill);

// 5. Profile Updates
router.post("/profile/update", authMiddleware, profileController.updateProfile);
router.post("/profile/picture", authMiddleware, upload.single("image"), profileController.uploadProfilePicture);
router.delete("/profile/picture", authMiddleware, profileController.deleteProfilePicture);

// Test Route
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ msg: `Welcome user ${req.user.id}` });
});

module.exports = router;
