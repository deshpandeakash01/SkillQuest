// server.js


require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const skillRoutes = require("./routes/skillRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI);

// middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000 // limit each IP to 10000 requests per windowMs
});
app.use(limiter);




// routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/protected", protectedRoutes);

app.get("/api", (req, res) => res.send("SkillQuest backend running"));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

const { ExpressPeerServer } = require("peer");
// Note: We need the server instance, but app is not listening yet.
// However, ExpressPeerServer documentation usually says it needs the http server.
// BUT, if we use app.use('/peerjs', ...), it handles the HTTP/WS requests.
// We can't initialize peerServer with 'server' before 'server' exists.
// CRITICAL: We changed to 'const server = app.listen()' at the bottom.
// We can't move 'peerServer = ExpressPeerServer(server)' up because 'server' is undefined there.
// SOLUTION: We must keep app.listen at the bottom, but we can define the middleware.
// WAIT. ExpressPeerServer(server) REQUIRES the http server instance.
// If we move app.use up, peerServer needs to be defined.
// If peerServer needs server, server must be defined.
// This is a circular dependency in the linear script if we want app.use() early.
//
// CORRECT PATTERN for Express + PeerJS:
// 1. Create http server from app explicitly: const server = require('http').createServer(app);
// 2. app.use(...)
// 3. custom routes
// 4. server.listen(...)
//
// Let's refactor to that standard pattern.

const http = require("http");
const server = http.createServer(app);

const peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use("/peerjs", peerServer);

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Handle SPA routing or fallback (optional, but good for safety)
app.get("*", (req, res, next) => {
  if (req.url.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server error"
  });
});

app.get("/api/test-auth", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    user: req.user.email
  });
});


// start server (LAST)
server.listen(PORT, '0.0.0.0', () =>
  console.log(`Server running on port ${PORT}`)
);
server.timeout = 0; // Disable timeout for large uploads


// Trigger Restart: 1
