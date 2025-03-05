import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/admin/users", { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));

    axios.get("http://localhost:5000/admin/logs", { withCredentials: true })
      .then((res) => setLogs(res.data))
      .catch((err) => console.error(err));

    setLoading(false);
  }, []);

  const updateRole = (id, role) => {
    axios.put(`http://localhost:5000/admin/users/${id}/role`, { role }, { withCredentials: true })
      .then(() => {
        alert("Role updated");
        setUsers(users.map(user => user.id === id ? { ...user, role } : user));
      })
      .catch((err) => console.error(err));
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div>
        <Navbar />
        <div className="container mt-5">
        <h1 className="text-center text-primary mb-4">Admin Dashboard</h1>

        {/* Manage Users */}
        <div className="card p-3 mb-4 shadow-sm">
            <h2 className="text-secondary">Manage Users</h2>
            <table className="table table-striped table-bordered">
            <thead className="table-dark">
                <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Change Role</th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => (
                <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                    <select
                        className="form-select"
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                    >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* Login Activity */}
        <div className="card p-3 shadow-sm">
            <h2 className="text-secondary">Login Activity</h2>
            <table className="table table-striped table-bordered">
            <thead className="table-dark">
                <tr>
                <th>Email</th>
                <th>Timestamp</th>
                </tr>
            </thead>
            <tbody>
                {logs.map((log, index) => (
                <tr key={index}>
                    <td>{log.email}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    </div>
  );
}

export default AdminDashboard;
