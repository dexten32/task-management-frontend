"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu, User, CircleCheck, ListCheck, LogOut } from "lucide-react";
import { SidebarLink } from "../../components/sidebarLinkComponent";
import { usePathname } from "next/navigation";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [EmployeeName, setEmployeeName] = useState("Employee");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "https://task-management-backend-iyjp.onrender.com/api/users/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setEmployeeName(data.name);
      }
    };

    fetchUser();
  }, []);
  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      window.location.href = "/"; // redirect to login page
    } catch (err) {
      console.error("Logout failed", err);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname = usePathname();
  return (
    <div className="flex h-screen bg-gray-700">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-800 text-white transition-all duration-300`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-lg font-bold">Employee Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8">
          <SidebarLink
            href="/employee/currentTask"
            icon={<CircleCheck />}
            label="Current Tasks"
            sidebarOpen={sidebarOpen}
          />
          <SidebarLink
            href="/employee/previousTask"
            icon={<ListCheck />}
            label="Previous Tasks"
            sidebarOpen={sidebarOpen}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-slate-100">
              Employee Panel
            </h2>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="hidden md:inline text-white">
                  {EmployeeName}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-50">
                  <button
                    onClick={handleLogout} // Replace with actual logout logic
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
