import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", { email, password });
    //   alert("Login successful!");

      localStorage.setItem("accessToken", response.data.accessToken); // Store token
      localStorage.setItem("role", response.data.role); // Store role

      // Redirect based on role
      if (response.data.role === "admin") {
        navigate("/admin-dashboard");
      } else if (["manager", "user"].includes(response.data.role)) {
        navigate("/dashboard");
      } else {
        alert("Invalid role!");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Login failed!");
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = "http://localhost:5000/auth/oauth"; // Redirect to OAuth login
  };

  return (
    <div>
        <Navbar />
        <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>
            <h2 className="text-center mb-4">Login</h2>

            <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            <div className="mb-3">
                <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
            </form>

            <div className="text-center my-3">
            <span className="text-muted">or</span>
            </div>

            <button onClick={handleOAuthLogin} className="btn btn-danger w-100">
            Login with OAuth
            </button>
        </div>
        </div>
    </div>
  );
}

export default Login;
