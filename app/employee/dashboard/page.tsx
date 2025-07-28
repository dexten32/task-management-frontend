"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockEmployeeTasks } from "@/lib/MockEmployeeTasks";

interface Task {
  id: number;
  title: string;
  due: string;
  status: "recent" | "delayed";
}

const typedMockEmployeeTasks: Task[] = mockEmployeeTasks as Task[];

export default function EmployeeDashboard() {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [delayedTasks, setDelayedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const recent = typedMockEmployeeTasks.filter(
      (task) => task.status === "recent"
    );
    const delayed = typedMockEmployeeTasks.filter(
      (task) => task.status === "delayed"
    );
    setRecentTasks(recent);
    setDelayedTasks(delayed);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Employee Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Recent Tasks Section */}
          <div className="w-full md:w-1/2 border-r border-gray-700 pr-4">
            <h2 className="text-xl font-medium mb-3 text-white">
              Recent Tasks
            </h2>
            <ul className="space-y-2">
              {recentTasks.map((task) => (
                <li key={task.id} className="text-sm text-slate-100">
                  {task.title} –{" "}
                  <span className="text-gray-400">Due: {task.due}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delayed Tasks Section */}
          <div className="w-full md:w-1/2 pl-4">
            <h2 className="text-xl font-medium mb-3 text-white">
              Delayed Tasks
            </h2>
            <ul className="space-y-2">
              {delayedTasks.map((task) => (
                <li key={task.id} className="text-sm text-red-500">
                  {task.title} –{" "}
                  <span className="text-gray-400">Was due: {task.due}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
