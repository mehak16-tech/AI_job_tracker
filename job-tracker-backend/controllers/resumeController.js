const pdfParse = require("pdf-parse");
const Resume = require("../models/Resume");

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text;

    // Save or update existing resume for user
    const resume = await Resume.findOneAndUpdate(
      { userId: req.user.userId },
      { 
        resumeText: extractedText,
        fileName: req.file.originalname,
        uploadedAt: new Date()
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: "Resume uploaded and saved successfully",
      resume
    });
  } catch (error) {
    console.error("ERROR in /resume/upload:", error.message);
    return res.status(500).json({
      message: "Failed to process PDF",
      error: error.message
    });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.userId });
    if (!resume) {
      return res.status(404).json({ message: "No resume found" });
    }
    return res.status(200).json(resume);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
