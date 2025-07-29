// frontend/components/TaskLogDisplay.tsx
"use client";

import React, { useState } from "react";

// Ensure these types match your Task and Log types defined elsewhere
interface Log {
  id: string;
  description: string;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  logs: Log[];
}

interface TaskLogDisplayProps {
  task: Task;
  onLogAdded: (newLog: Log) => void;
  token: string | null;
}

export default function TaskLogDisplay({
  task,
  onLogAdded,
  token,
}: TaskLogDisplayProps) {
  const [logDescription, setLogDescription] = useState("");
  const [addingLog, setAddingLog] = useState(false);

  const canAddLogs =
    task.status.toUpperCase() === "ACTIVE" ||
    task.status.toUpperCase() === "PENDING";

  const handleAddLog = async () => {
    if (!logDescription.trim() || !token) {
      alert("Please enter a log description.");
      return;
    }

    setAddingLog(true);
    try {
      const res = await fetch(
        `https://task-management-backend-iyjp.onrender.com/api/logs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskId: task.id,
            description: logDescription,
          }),
        }
      );

      if (res.ok) {
        const newLog: Log = await res.json();
        onLogAdded(newLog);
        setLogDescription("");
        console.log("Log added successfully:", newLog);
      } else {
        const errorData = await res.json();
        console.error("Failed to add log:", res.status, errorData);
        alert(`Failed to add log: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error adding log:", error);
      alert("Network error. Could not add log.");
    } finally {
      setAddingLog(false);
    }
  };

  return (
    <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">Task Logs</h2>

      {/* Log Input Area (conditionally rendered) - NOW AT THE TOP */}
      {canAddLogs && (
        <div className="mb-4 flex flex-col">
          <textarea
            value={logDescription}
            onChange={(e) => setLogDescription(e.target.value)}
            placeholder="Add a new log for this task..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          ></textarea>
          <button
            onClick={handleAddLog}
            disabled={addingLog || !logDescription.trim()}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded self-end disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingLog ? "Adding..." : "Add Log"}
          </button>
        </div>
      )}

      {/* Log Display Area - NOW BELOW THE INPUT */}
      <div className="bg-gray-900 text-gray-200 rounded p-4 max-h-64 overflow-y-auto border border-gray-700">
        {task.logs.length === 0 ? (
          <p className="text-gray-500 text-center">
            No logs yet for this task.
          </p>
        ) : (
          [...task.logs]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - // Changed to DESCENDING order
                new Date(a.createdAt).getTime()
            )
            .map((log) => {
              const logTime = new Date(log.createdAt);
              const deadlineTime = new Date(task.deadline);
              const isOnTime = logTime.getTime() <= deadlineTime.getTime();

              return (
                <div
                  key={log.id}
                  className="mb-2 last:mb-0 border-b border-gray-700 pb-2"
                >
                  <span
                    className={`font-mono text-sm ${
                      isOnTime ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    [{logTime.toLocaleDateString()}{" "}
                    {logTime.toLocaleTimeString()}]:{" "}
                  </span>
                  {log.description}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
