
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const internshipRoutes = require("./routes/internshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const workshopRoutes = require("./routes/workshopRoutes");
const eventRoutes = require("./routes/eventRoutes");
const hackathonRoutes = require("./routes/hackathonRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const userRoutes = require("./routes/userRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const commentRoutes = require("./routes/commentRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const projectSupportRoutes = require("./routes/projectSupportRoutes");
const xentieRoutes = require("./routes/xentieRoutes");

const app = express();

// Allowed frontend websites
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://community-platform-v2.pages.dev",
  "https://community-seven-gilt.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

// CORS: allow requests from the configured frontend websites
app.use(
  cors({
    origin: function (origin, callback) {
      const isVercelOrigin =
        typeof origin === "string" &&
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isVercelOrigin
      ) {
        return callback(null, true);
      }

      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Request body parsing
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Community Platform API is running",
  });
});

// Authentication
app.use("/api/auth", authRoutes);

// Opportunities and registrations
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/workshops", workshopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/opportunities", opportunityRoutes);

// Platform content
app.use("/api/announcements", announcementRoutes);
app.use("/api/comments", commentRoutes);

// Users and community
app.use("/api/users", userRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Uploads and resumes
app.use("/api/upload", uploadRoutes);
app.use("/api/resume", resumeRoutes);

// Analytics and project support
app.use("/api/analytics", analyticsRoutes);
app.use("/api/project-support", projectSupportRoutes);

// Xentie AI
app.use("/api/xentie", xentieRoutes);

// Not found
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("API error:", err.message || err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "This website is not allowed to access the API.",
    });
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

module.exports = app;
