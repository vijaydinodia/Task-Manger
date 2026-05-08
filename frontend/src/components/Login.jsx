import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

      const res = await axios.post(
        "https://task-manger-backend-a0da.onrender.com/user/login",
        form,
      );

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
    <div className="theme-bg">
      <div className="theme-card w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Welcome Back
        </h2>

        <p className="text-sm text-center mb-6 text-gray-500 dark:text-gray-300">
          Login to continue your journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={setData}
            className="theme-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={setData}
            className="theme-input"
          />

          <button
            type="submit"
            disabled={loading}
            className="theme-btn"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
