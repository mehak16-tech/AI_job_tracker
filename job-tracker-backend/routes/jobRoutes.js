const express = require("express");
const router = express.Router();

const { addJob, getJobs, getJobById, updateJob, deleteJob } = require("../controllers/jobController");
const authMiddleware = require("../middlewares/authMiddleware");

// Add job
router.post("/add", authMiddleware, addJob);

// Get all jobs
router.get("/", authMiddleware, getJobs);

// Get job by ID
router.get("/:id", authMiddleware, getJobById);

// Update job
router.put("/:id", authMiddleware, updateJob);

// Delete job
router.delete("/:id", authMiddleware, deleteJob);
module.exports = router;