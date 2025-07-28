"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  SelectContent,
  SelectField,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  departmentName?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: { name: string; id: string };
  assignedBy?: { name: string; id: string };
  deadline: string;
}

interface PendingUser extends User {
  role: string;
}

interface Department {
  id: string;
  name: string;
}

const DashboardPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [backendDelayedTasks, setBackendDelayedTasks] = useState<Task[]>([]);

  // New states for loading and error specific to the modal's data
  const [isModalDataLoading, setIsModalDataLoading] = useState(true);
  const [modalFetchError, setModalFetchError] = useState<string | null>(null);

  // Fetch users and departments
  useEffect(() => {
    const fetchUsersAndDepartments = async () => {
      setIsModalDataLoading(true); // Start loading
      setModalFetchError(null); // Clear previous errors
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        // Fetch users
        const userResponse = await fetch("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || "Failed to fetch users");
        }
        const usersData = await userResponse.json();
        console.log("1. Raw usersData from API (full response):", usersData);
        const usersArray = usersData.users || [];
        const mappedUsers: User[] = usersArray.map(
          (user: {
            department: { id: string; name: string } | null;
            id: string;
            name: string;
            email: string;
            departmentId: string | null;
            approved: boolean; // Add if used
            role: string;
          }) => {
            console.log(
              "User object *inside map function* (raw from API, before mapping):",
              user
            );
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              departmentId: user.departmentId,
              role: user.role,
              approved: user.approved, // Ensure departmentId is correctly extracted
            };
          }
        );
        console.log(
          "2. Mapped users (before setting allUsers state):",
          mappedUsers
        );
        setAllUsers(mappedUsers);

        // Fetch departments
        const deptResponse = await fetch(
          "http://localhost:5000/api/departments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!deptResponse.ok) {
          const errorData = await deptResponse.json();
          throw new Error(errorData.message || "Failed to fetch departments");
        }
        const departmentsData = await deptResponse.json();
        setDepartments(departmentsData.departments || []);
      } catch (error: unknown) {
        console.error("Failed to fetch users and departments", error);
        setModalFetchError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message ||
                "Failed to load data. Please check your connection."
            : "Failed to load data. Please check your connection."
        );
      } finally {
        setIsModalDataLoading(false); // End loading
      }
    };
    fetchUsersAndDepartments();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch pending user requests
  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const response = await fetch(
          "http://localhost:5000/api/users/pending",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch pending user requests"
          );
        }
        const data = await response.json();
        setPendingUsers(data.users || []);
      } catch (error: unknown) {
        console.error("Failed to fetch pending users", error);
        setError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message ||
                "Failed to load pending user requests."
            : "Failed to load pending user requests."
        );
      }
    };

    fetchPendingUsers();
  }, []);

  // Fetch recent tasks
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const res = await fetch(`http://localhost:5000/api/tasks/recentlimit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch recent tasks");
      }
      const data = await res.json();
      setRecentTasks(data || []);
      console.log("5. Recent tasks fetched:", data);
    } catch (err: unknown) {
      console.error("Failed to fetch recent tasks", err);
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Failed to load tasks."
          : "Failed to load tasks."
      );
    }
  };
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch delayed tasks
  useEffect(() => {
    const fetchBackendDelayedTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const res = await fetch("http://localhost:5000/api/tasks/delayed", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch delayed tasks");
        }
        const data = await res.json();
        setBackendDelayedTasks(data.tasks || []);
      } catch (err: unknown) {
        console.error("Failed to fetch backend delayed tasks", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message ||
                "Failed to load delayed tasks."
            : "Failed to load delayed tasks."
        );
      }
    };

    fetchBackendDelayedTasks();
  }, []);

  // Reset selected user when department changes
  useEffect(() => {
    setSelectedUser("");
  }, [selectedDeptId]);

  // Filter users based on the selected department
  const filteredUsers = allUsers.filter((user) => {
    return user.departmentId === selectedDeptId;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !title ||
      !description ||
      !deadline ||
      !selectedUser ||
      !selectedDeptId
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch("http://localhost:5000/api/tasks/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          deadline,
          assignedTo: selectedUser,
          departmentId: selectedDeptId || null,
        }),
      });

      if (response.ok) {
        setSuccess("Task created successfully!");
        setTitle("");
        setDescription("");
        setDeadline("");
        setSelectedUser("");
        setSelectedDeptId("");
        setTimeout(() => setIsModalOpen(false), 1500);
        fetchTasks(); // Refresh recent tasks
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create task");
      }
    } catch (err: unknown) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Error creating task"
          : "Error creating task"
      );
    }
  };

  const handleApproveUser = async (userId: string) => {
    console.log("APPROVE USER: Attempting to approve user with ID:", userId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(
        `http://localhost:5000/api/users/approve/${userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("APPROVE USER: Response status:", response.status);
      if (response.ok) {
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
        // Optionally refetch all users if approval changes their status or department
        // await fetchUsersAndDepartments();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to approve user");
      }
    } catch (error: unknown) {
      console.error("APPROVE USER: Error approving user:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to approve user."
          : "Failed to approve user."
      );
    }
  };

  const handleDeclineUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(
        `http://localhost:5000/api/users/decline/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
      } else {
        const data = await response.json();
        setError(data.message || "Failed to decline user");
      }
    } catch (error: unknown) {
      console.error("Error declining user:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to decline user."
          : "Failed to decline user."
      );
    }
  };

  const handleDepartmentChange = async (
    userId: string,
    departmentId: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(
        `http://localhost:5000/api/users/update/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ departmentId, role: "EMPLOYEE" }),
        }
      );
      if (response.ok) {
        // Update pending users if the user is still pending
        setPendingUsers(
          pendingUsers.map((user) =>
            user.id === userId ? { ...user, departmentId: departmentId } : user
          )
        );
        // Update allUsers to reflect the department change immediately
        setAllUsers(
          allUsers.map((user) =>
            user.id === userId ? { ...user, departmentId: departmentId } : user
          )
        );
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update department");
      }
    } catch (error: unknown) {
      console.error("Error updating user department:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
              "Failed to update department."
          : "Failed to update department."
      );
    }
  };

  // Helper function to get department name from ID (not directly used in modal dropdowns, but good for display)
  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "N/A";
    const department = departments.find((d) => d.id === departmentId);
    return department ? department.name : "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-700 text-gray-900 p-8 font-sans">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
        `}
      </style>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="rounded-xl shadow-md">
            <div className="flex flex-row items-center justify-between p-6 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Recent Tasks
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:text-white hover:bg-blue-700 rounded-lg px-4 py-2"
              >
                + New Task
              </Button>
            </div>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <li
                      key={task.id}
                      className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
                    >
                      <Link href={`/admin/tasks/${task.id}`} passHref>
                        <div className="cursor-pointer">
                          <p className="text-sm text-gray-600">
                            <strong>Title:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.title}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Description:</strong> {task.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Assigned To:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.assignedTo?.name || "N/A"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Assigned By:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.assignedBy?.name || "N/A"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Deadline:</strong>{" "}
                            {task.deadline
                              ? format(new Date(task.deadline), "PPPpp")
                              : "N/A"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="p-4 text-gray-500 text-center">
                    No recent tasks
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Delayed Tasks Card */}
          <Card className="rounded-xl shadow-md">
            <CardHeader className="p-6 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-800">
                Delayed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {backendDelayedTasks.length > 0 ? (
                  backendDelayedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex justify-between items-center p-4 border border-red-300 rounded-lg bg-red-50 shadow-sm"
                    >
                      <Link href={`/admin/tasks/${task.id}`} passHref>
                        <div className="flex-1 cursor-pointer">
                          <div>
                            <p className="font-medium text-gray-700">
                              {task.title}
                            </p>
                            <p className="text-sm text-red-500">
                              Overdue since:{" "}
                              {task.deadline
                                ? format(new Date(task.deadline), "PPPpp")
                                : "N/A"}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2"
                          >
                            Complete
                          </Button>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No delayed tasks.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - User Requests */}
        <Card className="h-full rounded-xl shadow-md">
          <CardHeader className="p-6 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-800">
              User Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {pendingUsers.length > 0 ? (
                pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="mt-2 relative">
                        <SelectField
                          value={
                            typeof user.departmentId === "object" &&
                            user.departmentId !== null
                              ? user.departmentId
                              : user.departmentId || ""
                          }
                          onValueChange={(value) =>
                            handleDepartmentChange(user.id, value)
                          }
                          disabled={departments.length === 0} // Disable if departments not loaded
                        >
                          <SelectTrigger className="w-[200px] bg-white">
                            <SelectValue
                              placeholder={
                                departments.length > 0
                                  ? "Select Department"
                                  : "Loading departments..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="absolute z-10 mt-1 w-[200px] border rounded shadow-md bg-white">
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectField>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeclineUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">
                  No pending user requests.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-100 text-gray-800 rounded-xl p-6 w-full max-w-md relative shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">
              Create New Task
            </h2>
            {isModalDataLoading ? (
              <div className="text-center py-8">
                <p className="text-lg text-gray-600">
                  Loading data for dropdowns...
                </p>
                {/* Simple spinner */}
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mt-4"></div>
              </div>
            ) : modalFetchError ? (
              <div className="text-center py-8">
                <p className="text-red-600 text-lg">{modalFetchError}</p>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <Input
                    id="title"
                    type="text"
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="deadline"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Deadline
                  </label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Department
                  </label>
                  <SelectField
                    value={selectedDeptId || ""}
                    onValueChange={(value: string) => {
                      console.log(
                        "Department SelectField onValueChange:",
                        value
                      );
                      setSelectedDeptId(value);
                      // selectedUser is reset by useEffect when selectedDeptId changes
                    }}
                    required
                    disabled={departments.length === 0} // Disable if no departments loaded
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue
                        placeholder={
                          departments.length > 0
                            ? "Select a department"
                            : "No departments available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="absolute z-10 mt-1 w-full border rounded shadow-md bg-white">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>

                <div>
                  <label
                    htmlFor="assignToUser"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Assign To User
                  </label>
                  <SelectField
                    value={selectedUser}
                    onValueChange={(value: string) => setSelectedUser(value)}
                    required
                    disabled={!selectedDeptId || filteredUsers.length === 0} // Disable if no department selected or no users in department
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue
                        placeholder={
                          !selectedDeptId
                            ? "Select department first"
                            : filteredUsers.length > 0
                            ? "Select a user"
                            : "No users in this department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="absolute z-10 mt-1 w-full border rounded shadow-md bg-white">
                      {filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>

                {error && (
                  <p className="text-red-600 text-sm text-center mt-3">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-green-600 text-sm text-center mt-3">
                    {success}
                  </p>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:text-white hover:bg-blue-700 px-6 py-2 rounded-lg"
                    disabled={isModalDataLoading} // Disable submit button while data is loading
                  >
                    Create Task
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
