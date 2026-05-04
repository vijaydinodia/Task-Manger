import  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setData = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return alert("All fields are required");
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/user/signup", form);

      alert(res.data.message || "Signup successful 🎉");

      setForm({ name: "", email: "", password: "" });

      // redirect to login
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-bg">
      <div className="theme-card w-full max-w-md">
        <h2
          className="text-2xl font-bold text-center mb-2 
          text-gray-800 dark:text-white"
        >
          Create Account 🚀
        </h2>

        <p
          className="text-sm text-center mb-6 
          text-gray-500 dark:text-gray-300"
        >
          Join and start managing your tasks
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={setData}
            className="theme-input"
          />

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
            {loading ? "Creating Account..." : "Signup"}
          </button>
        </form>

        <p className="text-sm text-center mt-4 text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
