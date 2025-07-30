"use client";
import { useEffect, useState } from "react";
import TaskDetailComponent from "@/components/taskDetailComponent";

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  logs: { id: string; description: string; createdAt: string }[];
  assignedBy?: { id: string; username: string; email: string };
  assignedTo?: {
    id: string;
    username: string;
    email: string;
    department?: { id: string; name: string };
  };
}

export default function ClientTaskDetail({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required.");
      return;
    }

    fetch(`https://task-management-backend-iyjp.onrender.com/api/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) data.status = data.status.toUpperCase();
        setTask(data);
      })
      .catch(() => setError("Failed to load task."));
  }, [taskId]);

  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;
  if (!task) return <p className="text-white text-center mt-8">Loading...</p>;

  return <TaskDetailComponent initialTask={task} token={localStorage.getItem("token")} />;
}
