import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return alert("Email is required");
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/user/forget", {
        email,
      });

      alert(res.data.message || "OTP sent successfully");
      navigate("/verifyOtp", { state: { email } });
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="Account recovery"
      title="Reset your password"
      subtitle="Enter your account email and we will send a one-time code to verify it is you."
      footer={
        <Link
          to="/login"
          className="block text-center text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
        >
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Email address
          </span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="theme-input"
          />
        </label>

        <button type="submit" disabled={loading} className="theme-btn">
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgetPassword;
