const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getAllSkills,
  addInterest,
  enrollSkill,
  teachSkill,
  completeSkill,
  rateTeacher,
  uploadVideo,
  deleteSkill
} = require("../controllers/skillController");

// Multer Config
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".webm");
  }
});
const upload = multer({ storage: storage });

router.get("/", getAllSkills);
router.post("/interest/:skillId", auth, addInterest);
router.post("/learn/:skillId", auth, enrollSkill);
router.post("/complete/:skillId", auth, completeSkill);
router.post("/teach/:skillId", auth, teachSkill);
router.post("/rate/:teacherId", auth, rateTeacher);
router.delete("/:id", auth, deleteSkill);

// Video Upload Route
router.post("/upload", auth, upload.single("video"), uploadVideo);

module.exports = router;
