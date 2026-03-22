const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploadMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/match", authMiddleware, upload.single("resume"), aiController.matchResume);

// 🔥 ADD THIS LINE
router.post("/analyze/:jobId", authMiddleware, aiController.analyzeJob);

module.exports = router;