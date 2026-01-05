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
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
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
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
