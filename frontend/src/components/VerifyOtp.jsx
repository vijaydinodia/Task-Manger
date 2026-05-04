import { useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

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

    // move to next input
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

      // go to reset password
      navigate("/resetPassword", { state: { email } });
    } catch (error) {
      alert(error.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <div className="theme-bg">
      <div className="theme-card w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Verify OTP 🔐
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">
          Enter the 6-digit OTP sent to your email
        </p>

        {/* OTP Inputs */}
        <div className="flex justify-between gap-2 mb-6">
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

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="theme-btn"
        >
          Verify OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyOtp;
