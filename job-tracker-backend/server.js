require("dotenv").config({ path: "./.env" }); // ✅ FIRST LINE

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const aiRoutes = require("./routes/aiRoutes");
const resumeRoutes = require("./routes/resumeRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load auth middleware
const authMiddleware = require("./middlewares/authMiddleware");

// Routes
app.use("/auth", authRoutes);

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed protected route",
    user: req.user
  });
});

//ai route
app.use("/ai", aiRoutes);

// resume route
app.use("/resume", resumeRoutes);

app.use("/jobs", jobRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});



// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});