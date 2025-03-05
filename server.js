require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const OAuth2orize = require("oauth2orize");
const cookieParser = require("cookie-parser");
const cors = require("cors");

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

// // Passport Local Strategy (For username/password authentication)
// passport.use(
//   new LocalStrategy(async (email, password, done) => {
//     try {
//       const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
//       if (user.rows.length === 0) return done(null, false, { message: "User not found" });

//       const isValid = await bcrypt.compare(password, user.rows[0].password);
//       return isValid ? done(null, user.rows[0]) : done(null, false, { message: "Incorrect password" });
//     } catch (err) {
//       return done(err);
//     }
//   })
// );

// const server = OAuth2orize.createServer();

// const clients = [{ id: "client1", secret: "secret123", redirectUris: ["http://localhost:3000/dashboard"] }];

// server.exchange(
//   OAuth2orize.exchange.password(async (client, email, password, done) => {
//     const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
//     if (user.rows.length === 0) return done(null, false);

//     const isValid = await bcrypt.compare(password, user.rows[0].password);
//     if (!isValid) return done(null, false);

//     const accessToken = jwt.sign({ email }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
//     const refreshToken = jwt.sign({ email }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

//     return done(null, accessToken, refreshToken);
//   })
// );
// app.post("/oauth/token", passport.authenticate("local", { session: false }), server.token(), (req, res) => {
//   res.json({ access_token: req.authInfo });
// });

// Signup Route
app.post("/signup", async (req, res) => {
  const { email, password, role = "User" } = req.body;
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

// Login Route (JWT)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

  if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

  const isValid = await bcrypt.compare(password, user.rows[0].password);
  if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

  const role = user.rows[0].role;
  const accessToken = jwt.sign({ email, role }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ email, role }, process.env.REFRESH_SECRET, { expiresIn: "7d" });

  await pool.query("INSERT INTO login_logs (user_id) VALUES ($1)", [user.rows[0].id]);

  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
  res.json({ accessToken, role});
});

// Token Refresh Route
app.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" });

    const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_SECRET, { expiresIn: "15m" });
    res.json({ accessToken });
  });
});

// Protected Route
app.get("/protected", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    res.json({ message: "Protected data", user });
  });
});

//Admin Dashboard routes
app.get("/admin/users", async (req, res) => {
    try {
      const users = await pool.query("SELECT id, email, role FROM users");
      res.json(users.rows);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

app.put("/admin/users/:id/role", async (req, res) => {
const { id } = req.params;
const { role } = req.body;
try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    res.json({ message: "Role updated successfully" });
} catch (err) {
    res.status(500).json({ message: "Server error" });
}
});

app.get("/admin/logs", async (req, res) => {
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
