const Job = require("../models/Job");

exports.addJob = async (req, res) => {
  try {
    const { company, role, description } = req.body;

    const job = new Job({
      userId: req.user.userId, // from JWT
      company,
      role,
      description,
    });

    await job.save();

    res.status(201).json({
      message: "Job added successfully",
      job,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user.userId });

    res.json(jobs);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ _id: id, userId: req.user.userId });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: id, userId: req.user.userId }, // ensure user owns job
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Job updated successfully",
      job,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Job deleted successfully",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};