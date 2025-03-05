import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/signup", { email, password });
      alert(response.data.message);
      window.location.href = "/";
    } catch (err) {
      alert(err.response?.data?.message || "An error occurred");
    }
  };


  return (
    <div>
        <Navbar />
        <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="card p-4 shadow-lg" style={{ maxWidth: "400px", width: "100%" }}>
            <h2 className="text-center mb-4">Sign Up</h2>

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
            <button type="submit" className="btn btn-primary w-100">Sign Up</button>
            </form>

            <div className="text-center mt-3">
            <span className="text-muted">Already have an account? </span>
            <a href="/" className="text-primary">Login</a>
            </div>
        </div>
        </div>
    </div>
  );
}

export default Signup;
