// frontend/components/TaskDetailComponent.tsx
"use client";

import React, { useState, useEffect } from "react";
import TaskLogDisplay from "./taskLogDisplay";

type Log = {
  id: string;
  description: string;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string; // e.g., "PENDING", "ACTIVE", "COMPLETED", "DELAYED" (uppercase)
  logs: Log[]; // This is the array of logs
};

interface TaskDetailComponentProps {
  initialTask: Task;
  token: string | null;
}

export default function TaskDetailComponent({
  initialTask,
  token,
}: TaskDetailComponentProps) {
  const [task, setTask] = useState<Task>(initialTask);

  // Effect to update internal task state if initialTask prop changes from parent
  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  // Handler for when a new log is successfully added from TaskLogDisplay
  const handleLogAdded = (newLog: Log) => {
    setTask((prevTask) => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        // Prepend the new log to the beginning of the logs array
        logs: [newLog, ...prevTask.logs],
      };
    });
  };

  // handleMarkAsComplete logic for the button
  const handleMarkAsComplete = async () => {
    if (!task || !token) return;

    const now = new Date();
    const deadline = new Date(task.deadline);
    // Determine new status based on deadline
    const newStatus = now < deadline ? "complete" : "delayed"; // Match backend uppercase status

    try {
      const res = await fetch(
        `https://task-management-backend-iyjp.onrender.com/api/tasks/${task.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setTask((prev) => (prev ? { ...prev, status: newStatus } : prev)); // Update local state
        console.log("Task status updated successfully to:", newStatus);
        // Optionally, add a log entry automatically for status change
        handleLogAdded({
          id: Date.now().toString(), // Temp ID for immediate display
          description: `Task status changed to ${newStatus}.`,
          createdAt: new Date().toISOString(),
        });
      } else {
        const errorData = await res.json();
        console.error("Failed to update task status:", res.status, errorData);
        alert(
          `Failed to update task status: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Network error updating task status:", error);
      alert("Network error. Could not update task status.");
    }
  };

  // Determine visibility for log input and Mark as Complete button based on task.status
  const canModifyTask =
    task.status.toUpperCase() === "ACTIVE" ||
    task.status.toUpperCase() === "PENDING";
  const showCompletedOrDelayedMessage =
    task.status.toUpperCase() === "COMPLETE" ||
    task.status.toUpperCase() === "DELAYED";

  // Helper function for dynamic status badge colors
  const getStatusBadgeClasses = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-semibold";
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return `${baseClasses} bg-blue-600 text-blue-100`;
      case "PENDING":
        return `${baseClasses} bg-yellow-600 text-yellow-100`;
      case "COMPLETED":
        return `${baseClasses} bg-green-600 text-green-100`;
      case "DELAYED":
        return `${baseClasses} bg-red-600 text-red-100`;
      default:
        return `${baseClasses} bg-gray-600 text-gray-100`;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      {/* Main Task Details Section */}
      <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700 mb-8">
        {/* Task Title */}
        <h1 className="text-4xl font-extrabold mb-4 text-slate-100 border-b border-gray-700 pb-3">
          {task.title.toUpperCase()}
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-300 leading-relaxed mb-6">
          {task.description}
        </p>

        {/* Deadline and Status - arranged with flexbox */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-700">
          {/* Deadline */}
          <div className="text-gray-400 text-base flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <span className="font-medium">Deadline:</span>{" "}
            {new Date(task.deadline).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>

          {/* Status Badge */}
          <div className={getStatusBadgeClasses(task.status)}>
            {task.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Task Log Display Component */}
      <TaskLogDisplay task={task} onLogAdded={handleLogAdded} token={token} />

      {/* Mark as Complete button */}
      {canModifyTask && (
        <button
          onClick={handleMarkAsComplete}
          className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-medium transition duration-200 ease-in-out transform hover:scale-105"
        >
          Mark as Complete
        </button>
      )}

      {/* Completion message */}
      {showCompletedOrDelayedMessage && (
        <p className="text-green-400 text-sm mt-4 p-3 bg-gray-700 rounded-lg">
          Task marked as {task.status.toUpperCase()}
        </p>
      )}
    </div>
  );
}
