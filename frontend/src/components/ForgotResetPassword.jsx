import { useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const ForgotResetPassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || "";
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const setData = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return alert("Please verify your email first");
    }

    if (!form.newPassword || !form.confirmPassword) {
      return alert("All fields are required");
    }

    if (form.newPassword !== form.confirmPassword) {
      return alert("Passwords do not match");
    }

    try {
      setLoading(true);
      const res = await axios.patch("http://localhost:5000/user/reset-forgot-password", {
        email,
        newPassword: form.newPassword,
      });

      alert(res.data.message || "Password reset successful");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      kicker="New password"
      title="Create a stronger login"
      subtitle={`Choose a new password for ${email || "your account"}.`}
      footer={
        <Link
          to="/forgot-password"
          className="block text-center text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
        >
          Send OTP again
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          name="newPassword"
          placeholder="New password"
          value={form.newPassword}
          onChange={setData}
          className="theme-input"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={setData}
          className="theme-input"
        />

        <button type="submit" disabled={loading} className="theme-btn">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotResetPassword;
