import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

const AddTask = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    taskName: "",
    deadline: "",
    priority: "medium",
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

    if (!form.taskName || !form.deadline || !form.priority || !form.note) {
      return alert("Task name, deadline, priority, and note are required");
    }

    if (!form.assignedTo) {
      return alert("Please select a user to assign this task");
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("taskName", form.taskName);
      formData.append("deadline", form.deadline);
      formData.append("priority", form.priority);
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
      <div className="mx-auto max-w-5xl">
        <div className="dashboard-hero mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="auth-kicker">Task creation</p>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
              Add a new task
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Define the work, assign an owner, and attach any supporting image.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(currentUser?.role === "admin" ? "/admin" : "/userDashborad")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-200"
          >
            Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="section-card grid gap-5 p-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Task name
            </span>
            <input
              type="text"
              name="taskName"
              placeholder="Write a clear task title"
              value={form.taskName}
              onChange={setData}
              className="theme-input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Deadline
            </span>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={setData}
              className="theme-input"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Priority
            </span>
            <select
              name="priority"
              value={form.priority}
              onChange={setData}
              className="theme-input"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Assign to
            </span>
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
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Notes
            </span>
            <textarea
              name="note"
              placeholder="Add the details the owner needs"
              value={form.note}
              onChange={setData}
              rows="4"
              className="theme-input resize-none"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Image attachment
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={setImageData}
              className="theme-input"
            />
          </label>

          <button
            type="submit"
            disabled={loading || users.length === 0}
            className="theme-btn md:col-span-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTask;
