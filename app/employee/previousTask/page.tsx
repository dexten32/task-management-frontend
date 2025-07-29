/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Ensure this Task interface matches your backend response from getMyTasks
// and the interface in CurrentTasksSection for consistency.
interface Task {
  id: string; // Prisma ID is a string UUID
  title: string;
  description: string;
  deadline: string;
  status: "active" | "completed" | "delayed"; // Explicitly define possible statuses
  // You might have assignedTo and assignedBy objects here too, depending on your Task interface in CurrentTasksSection
  assignedTo: {
    id: string;
    name: string;
    department?: { id: string; name: string } | null;
  };
  assignedBy: { id: string; name: string };
}

export default function PreviousTasksSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreviousTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        const res = await fetch(
          "https://task-management-backend-iyjp.onrender.com/api/tasks/previous",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data: Task[] = await res.json();
        console.log("Fetched tasks:", data); // Debugging line
        setTasks(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching previous tasks:", err);
        setError("Error fetching previous tasks.");
        setLoading(false);
      }
    };

    fetchPreviousTasks();
  }, []);
  // Helper function for status styling
  function getStatusColor(status: string) {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "delayed") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800"; // Fallback for other statuses, though not expected here
  }

  return (
    <div className="p-6 bg-gray-700 text-gray-800 min-h-screen">
      {/* Added padding and background for better look */}
      <h2 className="text-3xl font-bold mb-6 text-slate-100">
        Completed & Delayed Tasks
      </h2>
      {loading && (
        <p className="text-center text-lg text-gray-600">
          Loading previous tasks...
        </p>
      )}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}
      {!loading && !error && (
        <>
          {tasks.length === 0 ? (
            <p className="text-gray-600">
              No completed or delayed tasks found.
            </p>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className={task.status === "delayed" ? "bg-red-50" : ""}
                    >
                      {/* Highlight delayed */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link
                          href={`/employee/previousTask/${task.id}`}
                          className="hover:underline text-blue-600 block"
                        >
                          {task.title.toUpperCase()}
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
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
function setFormattedTasks(_arg0: unknown) {
  throw new Error("Function not implemented.");
}
