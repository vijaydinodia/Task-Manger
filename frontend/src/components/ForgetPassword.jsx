import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

      const res = await axios.post(
        "http://localhost:5000/user/forget",
        {
          email,
        },
      );

      alert(res.data.message || "OTP sent successfully");

      navigate("/verifyOtp", { state: { email } });
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
          Forgot Password 📩
        </h2>

        <p
          className="text-sm text-center mb-6 
          text-gray-500 dark:text-gray-300"
        >
          Enter your email to receive OTP
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="theme-input"
          />

          <button
            type="submit"
            disabled={loading}
            className="theme-btn"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgetPassword;
