
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const connectDB = require("./src/config/db");
const initSockets = require("./src/sockets");

const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://community-platform-v2.pages.dev",
  "https://community-seven-gilt.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

// Cloudflare Pages preview and Vercel preview URLs
function isAllowedPreviewOrigin(origin) {
  if (typeof origin !== "string") return false;

  const isCloudflarePagesPreview =
    /^https:\/\/[a-z0-9-]+\.community-platform-v2\.pages\.dev$/i.test(
      origin
    );

  const isVercelPreview =
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

  return isCloudflarePagesPreview || isVercelPreview;
}

const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isAllowedPreviewOrigin(origin)
      ) {
        return callback(null, true);
      }

      console.warn("Socket.IO CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);
initSockets(io);

// Start server after database connection succeeds
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
