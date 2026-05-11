import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "./AuthLayout";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const setData = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return alert("All fields are required");
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/user/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data.user?._id,
          name: res.data.user?.name,
          role: res.data.user?.role || res.data.role,
          email: res.data.user?.email || form.email,
        }),
      );

      localStorage.setItem("currUsername", form.email.split("@")[0]);

      alert(res.data.message || "Login successful");

      if ((res.data.user?.role || res.data.role) === "admin") {
        navigate("/admin");
      } else {
        navigate("/userDashborad");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Welcome back"
      title="Login to your account"
      subtitle="Use the email and password shared with your Task Manager account."
      sideTitle="Plan work, assign tasks, and keep the team moving."
      sideCopy="Review your dashboard, update progress, and manage daily work from one focused place."
      footer={
        <div className="subtle-card p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            New to Task Manager?
          </p>
          <Link
            to="/signup"
            className="mt-2 inline-flex font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
          >
            Create a new account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Email address
          </span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={setData}
            className="theme-input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Password
          </span>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={setData}
            className="theme-input"
          />
        </label>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
          >
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className="theme-btn">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
