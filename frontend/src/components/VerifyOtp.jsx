import { useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const VerifyOtp = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const { state } = useLocation();

  const email = state?.email || "";

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      return alert("Enter complete OTP");
    }

    try {
      const res = await axios.post("http://localhost:5000/user/verifyOtp", {
        email,
        otp: finalOtp,
      });

      alert(res.data.message);
      navigate("/reset-forgot-password", { state: { email } });
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <AuthLayout
      kicker="Verification"
      title="Enter your code"
      subtitle={`We sent a 6-digit OTP to ${email || "your email address"}.`}
      footer={
        <Link
          to="/forgot-password"
          className="block text-center text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
        >
          Use a different email
        </Link>
      }
    >
      <div className="mb-6 flex justify-between gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            type="text"
            maxLength="1"
            value={digit}
            ref={(el) => (inputsRef.current[index] = el)}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleBackspace(e, index)}
            className="h-12 w-12 rounded-lg text-center text-xl font-bold outline-none"
          />
        ))}
      </div>

      <button onClick={handleSubmit} className="theme-btn">
        Verify OTP
      </button>
    </AuthLayout>
  );
};

export default VerifyOtp;
