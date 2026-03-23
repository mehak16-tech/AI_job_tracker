const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
const genAI = hasGeminiKey ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-001",
  "gemini-flash-latest",
  "gemini-pro-latest"
];
let discoveredGeminiModels = null;

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function calculateFallbackMatchScore(resumeText, jobDescription) {
  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in", "is", "it", "its",
    "of", "on", "that", "the", "to", "was", "were", "will", "with", "or", "your", "you", "our", "we"
  ]);

  const resumeTokens = tokenize(resumeText).filter((w) => w.length > 2 && !stopWords.has(w));
  const jdTokens = tokenize(jobDescription).filter((w) => w.length > 2 && !stopWords.has(w));

  const resumeSet = new Set(resumeTokens);
  const jdSet = new Set(jdTokens);
  const uniqueJd = Array.from(jdSet);

  const matchingSkills = uniqueJd.filter((word) => resumeSet.has(word)).slice(0, 12);
  const missingSkills = uniqueJd.filter((word) => !resumeSet.has(word)).slice(0, 12);

  const denominator = uniqueJd.length || 1;
  const score = Math.round((matchingSkills.length / denominator) * 100);

  let recommendation = "review";
  if (score >= 75) recommendation = "hire";
  else if (score >= 45) recommendation = "maybe";

  return {
    matchScore: score,
    matchingSkills,
    missingSkills,
    assessment: `Fallback score based on keyword overlap (${matchingSkills.length}/${denominator}).`,
    recommendation,
    source: "fallback"
  };
}

async function discoverGeminiModels() {
  if (!hasGeminiKey) {
    return [];
  }

  if (discoveredGeminiModels) {
    return discoveredGeminiModels;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ListModels failed with status ${response.status}`);
    }

    const payload = await response.json();
    const models = (payload.models || [])
      .filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => (m.name || "").replace(/^models\//, ""))
      .filter((name) => name.startsWith("gemini"));

    discoveredGeminiModels = models;
    return models;
  } catch (error) {
    console.warn("Gemini model discovery failed:", error.message);
    return [];
  }
}

async function calculateMatchScore(resumeText, jobDescription) {
  if (!genAI) {
    const noKeyError = new Error("GEMINI_API_KEY is missing");
    noKeyError.code = "NO_GEMINI_KEY";
    throw noKeyError;
  }

  const prompt = `
You are an expert recruiter. Analyze the resume and job description, then provide:
1. A match score (0-100)
2. Key matching skills
3. Missing skills
4. Overall assessment

RESUME:
${resumeText.substring(0, 3000)}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)}

Respond ONLY in valid JSON format:
{
  "matchScore": <number 0-100>,
  "matchingSkills": [<array of skills>],
  "missingSkills": [<array of skills>],
  "assessment": "<brief summary>",
  "recommendation": "<hire/maybe/review>"
}`;

  const discovered = await discoverGeminiModels();
  const modelPool = Array.from(new Set([...GEMINI_MODEL_CANDIDATES, ...discovered]));

  let jsonText = null;
  let lastModelError = null;
  let usedModel = null;

  for (const candidate of modelPool) {
    try {
      const model = genAI.getGenerativeModel({ model: candidate });
      const response = await model.generateContent(prompt);
      jsonText = response.response.text().trim();
      usedModel = candidate;
      break;
    } catch (modelError) {
      lastModelError = modelError;
    }
  }

  if (!jsonText) {
    throw lastModelError || new Error("No Gemini model could generate content");
  }

  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid JSON response");

  const parsed = JSON.parse(jsonMatch[0]);
  parsed.usedModel = usedModel;
  return parsed;
}

exports.matchResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required in request body" });
    }

    const data = await pdfParse(req.file.buffer);
    const extractedText = data.text;

    let matchAnalysis;
    let scoringSource = "gemini";
    let scoringWarning = null;

    try {
      matchAnalysis = await calculateMatchScore(extractedText, jobDescription);
    } catch (aiError) {
      console.warn("Gemini scoring failed. Using fallback matcher.");
      matchAnalysis = calculateFallbackMatchScore(extractedText, jobDescription);
      scoringSource = "fallback";
      scoringWarning = aiError.message;
    }

    return res.json({
      message: "Resume analyzed and matched successfully",
      fileName: req.file.originalname,
      pages: data.numpages,
      textLength: extractedText.length,
      resumePreview: extractedText.substring(0, 300),
      scoringSource,
      scoringWarning,
      aiModel: matchAnalysis.usedModel || null,
      matchScore: {
        score: matchAnalysis.matchScore,
        recommendation: matchAnalysis.recommendation,
        matchingSkills: matchAnalysis.matchingSkills,
        missingSkills: matchAnalysis.missingSkills,
        assessment: matchAnalysis.assessment
      }
    });
  } catch (error) {
    console.error("ERROR in /ai/match:", error.message);
    return res.status(500).json({
      message: "Failed to process PDF",
      error: error.message
    });
  }
};

const Job = require("../models/Job");

exports.analyzeJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const Resume = require("../models/Resume");
    const userResume = await Resume.findOne({ userId: req.user.userId });
    
    if (!userResume || !userResume.resumeText) {
      return res.status(400).json({ message: "No resume found. Please upload a resume first." });
    }

    const resumeText = userResume.resumeText;

    let matchAnalysis;
    let scoringSource = "gemini";

    try {
      matchAnalysis = await calculateMatchScore(resumeText, job.description);
    } catch (aiError) {
      console.log("AI failed → fallback");

      matchAnalysis = calculateFallbackMatchScore(resumeText, job.description);
      scoringSource = "fallback";
    }

    const result = {
      score: matchAnalysis.matchScore,
      matchingSkills: matchAnalysis.matchingSkills,
      missingSkills: matchAnalysis.missingSkills,
      suggestions: matchAnalysis.missingSkills?.slice(0, 5) || [],
      analyzedAt: new Date(),
    };

    // 💾 Save in DB
    job.aiResult = result;
    await job.save();

    res.json({
      message: "Job analyzed with AI",
      scoringSource,
      aiResult: result,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};