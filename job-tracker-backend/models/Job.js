const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  company: String,
  role: String,
  description: String,
  status: {
    type: String,
    enum: ["Applied", "Interview", "Rejected"],
    default: "Applied",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Job", jobSchema);