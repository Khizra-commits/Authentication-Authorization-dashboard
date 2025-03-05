import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";

function Dashboard() {
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No token found!");
        const role = localStorage.getItem("role");

        setMessage("Welcome!");
        setDashboard(`Role: ${role}`);
      } catch (err) {
        setMessage("Unauthorized or error fetching dashboard!");
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
        <Navbar />
        <div className="container mt-5">
        <div className="card shadow-lg p-4">
            <h2 className="text-center text-primary">{message}</h2>
            <p className="text-muted text-center">{dashboard}</p>
        </div>
        </div>
    </div>
  );
}

export default Dashboard;
