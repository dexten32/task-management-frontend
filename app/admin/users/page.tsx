"use client";
import { useEffect, useState } from "react";

interface User {
  department: string | { name: string };
  approved: boolean;
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: string;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersTab() {
  const [pending, setPending] = useState<User[]>([]);
  const [employeesList, setEmployeesList] = useState<User[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string>("");

  const hardcodedRoles: Role[] = [
    { id: "admin_role_id", name: "ADMIN" }, // Use a unique ID, name matches Prisma enum
    { id: "employee_role_id", name: "EMPLOYEE" },
    { id: "manager_role_id", name: "MANAGER" },
  ];

  // Helper function to get the authorization token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json", // Important for POST/PATCH/PUT requests
    };
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(
          "https://task-management-backend-iyjp.onrender.com/api/departments",
          {
            headers: getAuthHeaders(),
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch departments: ${res.statusText}`);
        }
        const data = await res.json();
        setDepartments(data.departments || []);
        console.log("Departments:", data.departments);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError("Failed to load departments.");
      }
    };

    const fetchRoles = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch roles: ${res.statusText}`);
        }
        const data = await res.json();
        console.log("Roles data:", data);
        setRoles(data.roles || []);
        console.log("Roles:", data.roles);
      } catch (err) {
        console.error("Error fetching roles, using fallback:", err);
        setError("Failed to load roles, using fallback data.");
        // Fallback hardcoded roles if API not available:
        setRoles([
          { id: "admin", name: "Admin" },
          { id: "employee", name: "Employee" },
          { id: "manager", name: "Manager" },
        ]);
      }
    };

    const fetchPendingUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/pending", {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch pending users: ${res.statusText}`);
        }
        const data = await res.json();
        setPending(data.users || []);
        setError(""); // Clear error if successful
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to load pending users.");
      }
    };

    const fetchEmployees = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch employees: ${res.statusText}`);
        }
        const data = await res.json();
        const approved = data.users.filter((u: User) => u.approved === true);
        setEmployeesList(approved);
        setError(""); // Clear error if successful
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees.");
      }
    };

    fetchDepartments();
    fetchRoles();
    fetchPendingUsers();
    fetchEmployees();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleAccept = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/approve/${userId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to approve user: ${res.statusText}`);
      }
      setPending((prev) => prev.filter((user) => user.id !== userId));

      const employeesRes = await fetch(`http://localhost:5000/api/users`, {
        headers: getAuthHeaders(),
      });
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        const approved = employeesData.users.filter(
          (u: User) => u.approved === true
        );
        setEmployeesList(approved);
      }
      if (expandedUser === userId) setExpandedUser(null);
      setError("");
    } catch (err: unknown) {
      console.error("Error approving user:", err);
      setError("Error approving user.");
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/decline/${userId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to decline user: ${res.statusText}`);
      }
      setPending((prev) => prev.filter((user) => user.id !== userId));
      if (expandedUser === userId) setExpandedUser(null);
      setError("");
    } catch (err: unknown) {
      console.error("Error declining user:", err);
      setError("Error declining user.");
    }
  };

  const handleSave = async (userId: string) => {
    try {
      console.log("Saving user with:", {
        departmentId: editedUser.departmentId,
        role: editedUser.role,
      });

      const res = await fetch(
        `http://localhost:5000/api/users/update/${userId}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            departmentId: editedUser.departmentId,
            role: editedUser.role,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json(); // Attempt to read error message from backend
        throw new Error(
          errorData.message || `Failed to save user: ${res.statusText}`
        );
      }

      const updatedUser = await res.json();
      setEmployeesList(
        (prev) => prev.map((u) => (u.id === userId ? updatedUser.user : u)) // Assuming backend returns { user: updatedUserData }
      );
      setEditingUserId(null);
      setEditedUser({});
      setError(""); // Clear error on successful save
    } catch (err: unknown) {
      console.error("Error saving user:", err);
      setError(
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "An error occurred while saving the user."
      );
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/delete/${userId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to delete user: ${res.statusText}`);
      }
      setEmployeesList((prev) => prev.filter((u) => u.id !== userId));
      setEditingUserId(null);
      setEditedUser({});
      setError("");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error deleting user.");
    }
  };

  return (
    <div className="flex gap-6 p-6">
      {/* Employees Section */}
      <div className="flex-1 border p-4 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Employees</h3>
        <div className="space-y-3">
          {employeesList.map((user) => (
            <div
              key={user.id}
              className="flex flex-col bg-white rounded-md shadow-sm p-3"
            >
              {editingUserId === user.id ? (
                <>
                  <div className="flex flex-col gap-2">
                    {/* Department Dropdown */}
                    <select
                      value={editedUser.departmentId || ""}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          departmentId: e.target.value,
                        })
                      }
                      className="border p-2 rounded text-gray-800 bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>

                    {/* Role Dropdown */}
                    <select
                      value={editedUser.role || ""}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          role: e.target.value, // e.target.value will already be "ADMIN", "EMPLOYEE", etc.
                        })
                      }
                      className="border p-2 rounded text-gray-800 bg-white"
                    >
                      <option value="">Select Role</option>{" "}
                      {/* Empty value for initial selection */}
                      {hardcodedRoles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name.charAt(0) +
                            role.name.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => handleSave(user.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setEditingUserId(null);
                        setEditedUser({});
                      }}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-700">
                      {user.name}
                    </span>
                    <div className="text-sm text-gray-500">
                      {typeof user.department === "object" &&
                      user.department !== null
                        ? user.department.name
                        : user.department || "N/A"}{" "}
                      – {user.role || "N/A"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUserId(user.id);
                      setEditedUser({
                        departmentId: user.departmentId || "",
                        role: user.role ? user.role.toUpperCase() : "",
                      });
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending Section */}
      <div className="flex-1 border p-4 rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Pending Requests
        </h3>
        {pending.length === 0 && (
          <div className="text-gray-500">No pending user requests.</div>
        )}
        <div className="space-y-3">
          {pending.map((user) => {
            const dept = departments.find((d) => d.id === user.departmentId);
            return (
              <div
                key={user.id}
                className="bg-white rounded-md shadow-sm p-3 cursor-pointer"
                onClick={() =>
                  setExpandedUser(expandedUser === user.id ? null : user.id)
                }
              >
                <div className="flex justify-between items-center p-3">
                  <span className="font-medium text-gray-700">{user.name}</span>
                  <span className="text-sm text-gray-500">
                    {dept ? dept.name : "N/A"}
                  </span>
                </div>
                {expandedUser === user.id && (
                  <div className="bg-gray-100 rounded-b-md p-3 text-gray-600">
                    <p>Email: {user.email}</p>
                    <p>ID: {user.id}</p>
                    <div className="flex gap-3 mt-3">
                      <button
                        className="bg-green-500 px-3 py-1 rounded text-white hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(user.id);
                        }}
                      >
                        Accept
                      </button>
                      <button
                        className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecline(user.id);
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {error && (
        <div className="absolute bottom-6 left-6 bg-red-600 text-white p-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
