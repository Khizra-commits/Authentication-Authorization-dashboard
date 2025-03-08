require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { authenticateToken, isAdmin } = require("./authMiddleware");
const { signupValidation, loginValidation } = require("./validators/authValidator");
const { validationResult } = require("express-validator");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "node_demo",
  password: "postgres",
  port: 5432,
});

// Signup Route
app.post("/signup", signupValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role = "user" } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await pool.query(
        `INSERT INTO users (email, password, role) VALUES ($1, $2, $3)`,
        [email, hashedPassword, role]
      );
      res.json({ message: "User registered successfully!" });
    } catch (err) {
      res.status(500).json({ message: "User already exists or DB error!" });
    }
  });

  // Login Route
  app.post("/login", loginValidation, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userQuery.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = userQuery.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

    const accessToken = jwt.sign({ email: user.email, role: user.role }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ email: user.email, role: user.role }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

    await pool.query("INSERT INTO login_logs (user_id) VALUES ($1)", [user.id]);

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
    res.json({ message: "Login successful!", accessToken, role: user.role });
  });


// Token Refresh Route
app.post("/refresh", async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });

    // Verify if the token exists in the database
    const storedToken = await pool.query("SELECT user_id FROM refresh_tokens WHERE token = $1", [refreshToken]);
    if (storedToken.rows.length === 0) return res.status(403).json({ error: "Forbidden" });

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, user) => {
      if (err) return res.status(403).json({ error: "Forbidden" });

      const newAccessToken = jwt.sign({ id: user.id }, process.env.ACCESS_SECRET, { expiresIn: "15m" });

      res.json({ accessToken: newAccessToken });
    });
  });

// Logout Route
  app.post("/logout", async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(400).json({ error: "No token provided" });

    // Remove the token from the database
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  });

// Get All Users (Admin only)
app.get("/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try {
      const users = await pool.query("SELECT id, email, role FROM users");
      res.json(users.rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update User Role (Admin only)
  app.put("/admin/users/:id/role", authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
      await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
      res.json({ message: "Role updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get Login Logs (Admin only)
  app.get("/admin/logs", authenticateToken, isAdmin, async (req, res) => {
    try {
      const logs = await pool.query(
        "SELECT users.email, login_logs.timestamp FROM login_logs JOIN users ON login_logs.user_id = users.id ORDER BY login_logs.timestamp DESC"
      );
      res.json(logs.rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

// Start Server
app.listen(5000, () => console.log("OAuth2 + JWT Server running on port 5000"));
