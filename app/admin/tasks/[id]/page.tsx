import { cookies } from "next/headers";
import TaskDetailComponent from "../../../../components/taskDetailComponent"; // Reusing your existing component

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

interface TaskDetailPageProps {
  params: { id: string };
}

export default async function AdminTaskDetailPage({
  params,
}: TaskDetailPageProps) {
  const taskId = params.id;
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value ?? null;

  if (!token) {
    return (
      <p className="text-red-500 text-center mt-8">
        Authentication required to view task details.
      </p>
    );
  }

  let initialTask: Task | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(
      `https://task-management-backend-iyjp.onrender.com/api/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      initialTask = await res.json();

      if (initialTask && initialTask.status) {
        initialTask.status = initialTask.status.toUpperCase();
      }
    } else {
      const errorData = await res.json();
      error = errorData.message || `Failed to fetch task: ${res.status}`;
      console.error("Failed to fetch task:", res.status, errorData);
    }
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "message" in e &&
      typeof (e as { message?: unknown }).message === "string"
    ) {
      error = (e as { message: string }).message;
    } else {
      error = "Network error fetching task details.";
    }
    console.error("Network error fetching task:", e);
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-white">
        <h1 className="text-3xl font-bold mb-4">Task Details (Admin View)</h1>
        <p className="text-red-500 text-center mt-8">Error: {error}</p>
      </div>
    );
  }

  if (!initialTask) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-white">
        <h1 className="text-3xl font-bold mb-4">Task Details (Admin View)</h1>
        <p className="text-yellow-500 text-center mt-8">
          Task not found or not loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-white mb-6">
        Task Details (Admin View)
      </h1>
      <TaskDetailComponent initialTask={initialTask} token={token} />
    </div>
  );
}
