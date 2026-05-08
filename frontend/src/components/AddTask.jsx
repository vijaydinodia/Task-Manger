import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://task-manger-backend-a0da.onrender.com";

const AddTask = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    taskName: "",
    deadline: "",
    note: "",
    assignedTo: "",
  });
  const [image, setImage] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/task-users`, { headers });
        const taskUsers = res.data.users || [];
        setUsers(taskUsers);

        if (taskUsers.length > 0) {
          setForm((prev) => ({
            ...prev,
            assignedTo: prev.assignedTo || taskUsers[0]._id,
          }));
        }
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load users");
      }
    };

    fetchUsers();
  }, [headers]);

  const setData = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const setImageData = (e) => {
    setImage(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.taskName || !form.deadline || !form.note) {
      return alert("Task name, deadline, and note are required");
    }

    if (!form.assignedTo) {
      return alert("Please select a user to assign this task");
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("taskName", form.taskName);
      formData.append("deadline", form.deadline);
      formData.append("note", form.note);
      formData.append("assignedTo", form.assignedTo);

      if (image) {
        formData.append("image", image);
      }

      await axios.post(`${API_URL}/task/add`, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Task added successfully");
      navigate(currentUser?.role === "admin" ? "/admin" : "/userDashborad");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-page">
      <div className="theme-card mx-auto max-w-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Add Task
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="taskName"
            placeholder="Task name"
            value={form.taskName}
            onChange={setData}
            className="theme-input"
          />

          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={setData}
            className="theme-input"
          />

          <select
            name="assignedTo"
            value={form.assignedTo}
            onChange={setData}
            disabled={users.length === 0}
            className="theme-input"
          >
            <option value="">
              {users.length === 0 ? "No active users available" : "Assign to user"}
            </option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>

          <textarea
            name="note"
            placeholder="Task note"
            value={form.note}
            onChange={setData}
            rows="4"
            className="theme-input resize-none"
          />

          <input
            type="file"
            accept="image/*"
            onChange={setImageData}
            className="theme-input"
          />

          <button
            type="submit"
            disabled={loading || users.length === 0}
            className="theme-btn disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTask;
