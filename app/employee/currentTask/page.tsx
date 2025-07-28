"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DecodedToken {
  id: string; // Matches the 'id' in your JWT payload
  email: string;
  name?: string; // Add name if your JWT payload includes it
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

// Updated Task Interface to match backend response from getMyTasks
interface Task {
  id: string; // Prisma ID is a string UUID
  title: string;
  description: string;
  deadline: string;
  status: string; // e.g., "active", "completed", "delayed"
  assignedTo: {
    id: string;
    name: string;
    department?: { id: string; name: string } | null;
  };
  assignedBy: { id: string; name: string };
}

export default function CurrentTasksSection() {
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  // Effect to get logged-in user ID from JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeJwtToken(token);
      if (decoded && decoded.id) {
        setLoggedInUserId(decoded.id);
      } else {
        setError("Failed to decode user ID from token.");
      }
    } else {
      setError("No authentication token found. Please log in.");
    }
  }, []);

  // Function to fetch tasks assigned to the logged-in user
  const fetchMyTasks = useCallback(async () => {
    if (!loggedInUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`http://localhost:5000/api/tasks/my-tasks`, {
        // Using the /my-tasks endpoint
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch tasks");
      }

      const data = await res.json();
      // Backend's getMyTasks returns an array directly
      const fetchedTasks: Task[] = data.map((task: Task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status,
        assignedTo: task.assignedTo || { id: "", name: "N/A" },
        assignedBy: task.assignedBy || { id: "", name: "N/A" },
      }));

      // Separate tasks into current and previous based on status
      const activeTasks = fetchedTasks.filter((t) => t.status === "active");

      setCurrentTasks(activeTasks);
    } catch (err: unknown) {
      console.error("Error fetching tasks:", err);
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Failed to load tasks."
      );
      setCurrentTasks([]);
    } finally {
      setLoading(false);
    }
  }, [loggedInUserId]); // Re-fetch when loggedInUserId changes

  // Fetch tasks on component mount and when loggedInUserId becomes available
  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]); // Depend on fetchMyTasks to re-run when it changes (due to useCallback)

  // Handle marking a task as complete/delayed
  const handleComplete = async (taskId: string) => {
    setError(null); // Clear previous errors
    const taskToMove = currentTasks.find((t) => t.id === taskId);
    if (!taskToMove) {
      setError("Task not found to mark as complete.");
      return;
    }

    const now = new Date();
    const deadline = new Date(taskToMove.deadline);
    const newStatus = now < deadline ? "complete" : "delayed"; // Ensure these match backend enum values

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update task status.");
      }

      await fetchMyTasks();
    } catch (err: unknown) {
      console.error("Error marking task as complete:", err);
      setError(
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Failed to mark task as complete."
      );
    }
  };

  return (
    <div className="p-6 bg-gray-700 text-gray-800 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-slate-100">My Tasks</h2>

      {loading && (
        <p className="text-center text-lg text-slate-100">Loading tasks...</p>
      )}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}

      {!loading && !error && (
        <>
          {/* Current Tasks */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-slate-100">
              Current Tasks
            </h3>
            {currentTasks.length === 0 ? (
              <p className="text-slate-400">No active tasks assigned to you.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTasks.map((task) => (
                      <tr key={task.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                          <Link href={`/employee/currentTask/${task.id}`}>
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                          {task.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(task.deadline).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.status === "active"
                                ? "bg-blue-100 text-blue-800"
                                : task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleComplete(task.id)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            Mark as Complete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Previous Tasks (Completed/Delayed) */}
        </>
      )}
    </div>
  );
}
