"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

interface Task {
  id: string; // Changed from taskId: number to id: string to match Prisma UUIDs
  title: string;
  description: string;
  deadline: string;
  assignedTo: { id: string; name: string }; // Expecting an object from backend
  department: string; // This will still be a challenge as backend doesn't return it directly on task
  status: string;
  assignedBy: { id: string; name: string }; // Expecting an object from backend
}

interface FetchedTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedTo?: { id: string; name: string; department?: { name?: string } };
  status: string;
  assignedBy?: { id: string; name: string };
}

interface User {
  id: string;
  name: string;
  departmentId: string | null; // User's department ID
  departmentName?: string;
}

interface Department {
  id: string;
  name: string;
}

// Helper to decode JWT token (re-used from previous debugging)
interface DecodedToken {
  id: string; // Matches the 'id' in your JWT payload
  email: string;
  role: string;
  iat: number;
  exp?: number;
}

const decodeJwtToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null;
  }
};

// Custom hook to get logged in admin's info
function useLoggedInAdmin() {
  const [adminInfo, setAdminInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeJwtToken(token);
      if (decoded && decoded.id) {
        // Assuming 'name' isn't in token, using email or a placeholder
        setAdminInfo({
          id: decoded.id,
          name: decoded.email || "Logged-in Admin",
        });
      } else {
        console.warn("Token found but could not decode or extract ID.");
        setAdminInfo(null);
      }
    } else {
      console.warn("No authentication token found in localStorage.");
      setAdminInfo(null);
    }
  }, []); // Run once on mount

  return adminInfo;
}

export default function AdminTasksPage() {
  const loggedInAdmin = useLoggedInAdmin();
  const loggedInAdminId = loggedInAdmin?.id; // This will now be the actual UUID

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedUser, setSelectedUser] = useState<string>("All");

  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments on mount
  useEffect(() => {
    async function fetchDepartments() {
      setLoadingDepartments(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(
          "https://task-management-backend-iyjp.onrender.com/api/departments",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch departments");
        }
        const data = await res.json();
        setDepartments(data.departments);
      } catch (error: unknown) {
        console.error("Error fetching departments:", error);
        setError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message ||
                "Failed to load departments."
            : "Failed to load departments."
        );
      } finally {
        setLoadingDepartments(false);
      }
    }
    fetchDepartments();
  }, []);

  // Fetch users by department whenever department changes
  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const url =
          selectedDepartment === "All"
            ? "https://task-management-backend-iyjp.onrender.com/api/users"
            : `https://task-management-backend-iyjp.onrender.com/api/users?department=${encodeURIComponent(
                selectedDepartment
              )}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch users");
        }
        const data = await res.json();
        // Map users to ensure departmentId is correctly picked up
        const mappedUsers: User[] = data.users.map(
          (user: User & { department?: { name?: string } }) => ({
            id: user.id,
            name: user.name,
            departmentId: user.departmentId || null,
            departmentName: user.department?.name || null, // Assuming department object is populated
          })
        );
        setUsers(mappedUsers);
        setSelectedUser("All"); // reset user filter on department change
      } catch (error: unknown) {
        console.error("Error fetching users:", error);
        setError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message || "Failed to load users."
            : "Failed to load users."
        );
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, [selectedDepartment]);

  // Fetch tasks assigned by this admin
  useEffect(() => {
    async function fetchTasks() {
      if (!loggedInAdminId) {
        setTasks([]); // Clear tasks if no admin ID is available
        setLoadingTasks(false);
        return;
      }

      setLoadingTasks(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        // Fetch tasks assigned by this admin
        const res = await fetch(
          `https://task-management-backend-iyjp.onrender.com/api/tasks/recent`, // This endpoint uses req.user.id
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch tasks");
        }
        const data = await res.json();
        // Backend's getRecentTasks returns { tasks: [...] }
        const fetchedTasks = data.tasks || [];
        console.log("Fetched tasks:", fetchedTasks); // Debugging line

        // Map backend task data to frontend Task interface

        const mappedTasks: Task[] = fetchedTasks.map((task: FetchedTask) => {
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            assignedTo: task.assignedTo || { id: "", name: "N/A" },
            department: task.assignedTo?.department?.name || "N/A",
            status: task.status,
            assignedBy: task.assignedBy || { id: "", name: "N/A" },
          };
        });
        setTasks(mappedTasks);
      } catch (error: unknown) {
        console.error("Error fetching tasks:", error);
        setError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message || "Failed to load tasks."
            : "Failed to load tasks."
        );
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    }
    // Only fetch tasks if loggedInAdminId is available
    if (loggedInAdminId) {
      fetchTasks();
    }
  }, [loggedInAdminId]); // Re-run when loggedInAdminId changes

  // Filter tasks based on selected department and user (frontend filtering)
  const filteredTasks = (tasks || []).filter((task) => {
    const departmentMatch =
      selectedDepartment === "All" || task.department === selectedDepartment;

    const userMatch =
      selectedUser === "All" || task.assignedTo.name === selectedUser;

    return departmentMatch && userMatch;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans rounded-xl">
      <h1 className="text-3xl font-bold text-white mb-8">
        Tasks Assigned by You
      </h1>

      {error && (
        <div className="bg-red-800 text-white p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        {/* Department Filter */}
        <div className="flex flex-col">
          <label
            htmlFor="department"
            className="block text-sm text-gray-400 mb-2"
          >
            Filter by Department
          </label>
          {loadingDepartments ? (
            <p className="text-gray-400">Loading departments...</p>
          ) : (
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.name}>
                  {dep.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* User Filter */}
        <div className="flex flex-col">
          <label htmlFor="user" className="block text-sm text-gray-400 mb-2">
            Filter by User
          </label>
          {loadingUsers ? (
            <p className="text-gray-400">Loading users...</p>
          ) : (
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-6">
        {loadingTasks ? (
          <p className="text-gray-400 text-lg">Loading tasks...</p>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-800 p-6 rounded-lg text-white shadow-lg"
            >
              <Link href={`/admin/tasks/${task.id}`} className="block">
                <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
                <p className="text-sm text-gray-300 mb-3">{task.description}</p>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>
                    <span className="font-semibold text-gray-300">
                      Deadline:
                    </span>{" "}
                    {new Date(task.deadline).toLocaleString()}{" "}
                    {/* Format date */}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">
                      Assigned To:
                    </span>{" "}
                    {task.assignedTo?.name || "N/A"}{" "}
                    {/* Access name property */}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">
                      Department:
                    </span>{" "}
                    {task.department || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">Status:</span>{" "}
                    {task.status}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-300">
                      Assigned By:
                    </span>{" "}
                    {task.assignedBy?.name || "N/A"}
                  </p>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-lg text-center py-10">
            No tasks found for the selected filters.
          </p>
        )}
      </div>
    </div>
  );
}
