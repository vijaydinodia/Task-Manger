import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

const EditProfile = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    name: storedUser.name || "",
  });
  const [loading, setLoading] = useState(false);

  const setData = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Name is required");
    }

    try {
      setLoading(true);
      const res = await axios.patch(
        `${API_URL}/user/editProfile`,
        { name: form.name.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const updatedUser = {
        ...storedUser,
        ...res.data.user,
        role: storedUser.role,
        status: storedUser.status,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert(res.data.message || "Profile updated");
      navigate(updatedUser.role === "admin" ? "/admin" : "/userDashborad");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-bg">
      <div className="theme-card w-full max-w-md p-6">
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Edit Profile
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-300">
          Update your profile name.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={setData}
            className="theme-input"
          />

          <input
            type="email"
            value={storedUser.email || ""}
            disabled
            className="theme-input cursor-not-allowed opacity-70"
          />

          <button type="submit" disabled={loading} className="theme-btn">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
