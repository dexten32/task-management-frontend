/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // For routing after login

import { Button } from "./ui/button"; // Assuming you have a Button component
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Mail, User, Shield } from "lucide-react";

export default function ServiceCompanyLanding() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      try {
        const response = await fetch(
          "https://task-management-backend-iyjp.onrender.com/api/users/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Login failed");
          return;
        }
        const data = await response.json();
        console.log(data);

        const role = data.user?.role?.toUpperCase();

        // Save JWT token for future authenticated requests
        localStorage.setItem("token", data.token);

        if (data.user.role === "ADMIN") {
          router.push("/admin/dashboard");
          router.refresh(); // Refresh to ensure admin dashboard loads correctly
          //   onLogin("admin");
        } else if (data.user.role === "EMPLOYEE") {
          router.push("/employee/currentTask");
          router.refresh(); // Refresh to ensure employee dashboard loads correctly
          //   onLogin("employee");
        } else {
          console.error("Unknown user role received:", role);
          setError("Unknown user role");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwords don't match!");
        return;
      }
      // You can replace this with backend signup call later
      try {
        const response = await fetch(
          "https://task-management-backend-iyjp.onrender.com/api/users/signup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Signup failed");
          return;
        }

        alert("Account created successfully. Please wait for admin approval.");
        setIsLogin(true);
      } catch (err) {
        setError("Network error. Please try again.");
      }
      setIsLogin(true);
    }
  };
  // Utility function to add Authorization header for future requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    };
  };

  return (
    <div className="min-h-screen bg-gray-700 flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-slate-100" />
            <span className="text-xl font-bold text-slate-100">
              Cynox Security
            </span>
          </div>
          <button className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-gray-800">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-cyan-300 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button type="submit" className="w-full">
                {isLogin ? "Sign In" : "Sign Up"}
              </Button>

              <div className="text-center text-sm text-slate-150">
                {isLogin ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(false)}
                      className="text-cyan-300 hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsLogin(true)}
                      className="text-indigo-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-100">
        © {new Date().getFullYear()} CynoxSecurity. All rights reserved.
      </footer>
    </div>
  );
}
