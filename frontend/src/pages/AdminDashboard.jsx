import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import useTableview from "../custom_hook/UseTableview";

const API_URL = "http://localhost:5000";
const UNTAGGED_COLUMN_ID = "untagged";

const BoardColumn = ({ column, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-80 w-80 shrink-0 flex-col rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 ${
        isOver ? "ring-2 ring-indigo-500" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${column.color}`} />
          <h3 className="truncate text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">
            {column.name}
          </h3>
        </div>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {column.count}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">{children}</div>
    </section>
  );
};

const DraggableTaskCard = ({ task, isBusy, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    disabled: isBusy,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 20 : "auto",
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 ${
        isDragging ? "opacity-70 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        className="mb-3 flex w-full cursor-grab items-center justify-between rounded-md bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 active:cursor-grabbing dark:bg-gray-700 dark:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <span>Drag task</span>
        <span className="text-base leading-none">::</span>
      </button>
      {children}
    </article>
  );
};

const AdminDashboard = () => {
  const [active, setActive] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [tagName, setTagName] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [actionUserId, setActionUserId] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [actionTaskId, setActionTaskId] = useState("");
  const [taskSorts, setTaskSorts] = useState(["newest"]);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const {
    isTableView: isTaskTableView,
    viewButtonClass: taskViewButtonClass,
    showCardView: showTaskCardView,
    showTableView: showTaskTableView,
  } = useTableview();
  const {
    isTableView: isUserTableView,
    viewButtonClass: userViewButtonClass,
    showCardView: showUserCardView,
    showTableView: showUserTableView,
  } = useTableview();
  const [taskForm, setTaskForm] = useState({
    taskName: "",
    deadline: "",
    priority: "medium",
    note: "",
    assignedTo: "",
    status: "pending",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const res = await axios.get(`${API_URL}/task/all`, {
        headers,
        params: { sortBy: taskSorts.join(","), search: taskSearch.trim() },
      });
      setTasks(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }, [headers, taskSearch, taskSorts]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`${API_URL}/user/all`, {
        headers,
        params: { search: userSearch.trim() },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [headers, userSearch]);

  const fetchTags = useCallback(async () => {
    try {
      setLoadingTags(true);
      const res = await axios.get(`${API_URL}/task/tags`, { headers });
      setTags(res.data.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load tags");
    } finally {
      setLoadingTags(false);
    }
  }, [headers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchTasks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const toggleUserStatus = async (user) => {
    try {
      setActionUserId(user._id);
      const res = await axios.patch(
        `${API_URL}/user/userStatus`,
        { userId: user._id },
        { headers },
      );

      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id ? { ...item, status: res.data.status } : item,
        ),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status");
    } finally {
      setActionUserId("");
    }
  };

  const deleteUser = async (user) => {
    const ok = window.confirm(`Delete ${user.name}? This cannot be undone.`);
    if (!ok) return;

    try {
      setActionUserId(user._id);
      await axios.delete(`${API_URL}/user/delete/${user._id}`, { headers });
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionUserId("");
    }
  };

  const setUserData = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const createUser = async (e) => {
    e.preventDefault();

    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password) {
      return alert("Name, email, and password are required");
    }

    try {
      setCreatingUser(true);
      const res = await axios.post(`${API_URL}/user/admin-create`, userForm, {
        headers,
      });
      setUsers((prev) => [res.data.user, ...prev]);
      setUserForm({ name: "", email: "", password: "" });
      alert(res.data.message || "User created and login details emailed");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const createTag = async (e) => {
    e.preventDefault();

    if (!tagName.trim()) {
      return alert("Tag name is required");
    }

    try {
      setCreatingTag(true);
      const res = await axios.post(
        `${API_URL}/task/tags`,
        { name: tagName.trim() },
        { headers },
      );
      setTags((prev) => [...prev, res.data.data]);
      setTagName("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  const formatDateInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const getTaskImageUrl = (task) => task.image?.downloadUrl || task.image?.url || "";

  const getTaskImageName = (task) =>
    task.image?.originalName || `${task.taskName || "task"}-image`;

  const startEditTask = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      taskName: task.taskName || "",
      deadline: formatDateInput(task.deadline),
      priority: task.priority || "medium",
      note: task.note || "",
      assignedTo: task.assignedTo?._id || "",
      status: task.status || "pending",
    });
  };

  const setTaskData = (e) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateTaskInState = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)),
    );
  };

  const updateTask = async (taskId) => {
    if (
      !taskForm.taskName ||
      !taskForm.deadline ||
      !taskForm.priority ||
      !taskForm.note ||
      !taskForm.assignedTo
    ) {
      return alert("Task name, deadline, priority, assigned user, and note are required");
    }

    try {
      setActionTaskId(taskId);
      const res = await axios.put(`${API_URL}/task/update/${taskId}`, taskForm, {
        headers,
      });
      updateTaskInState(res.data.data);
      setEditingTaskId("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update task");
    } finally {
      setActionTaskId("");
    }
  };

  const updateTaskPriority = async (task, priority) => {
    try {
      setActionTaskId(task._id);
      const res = await axios.put(
        `${API_URL}/task/update/${task._id}`,
        { priority },
        { headers },
      );
      updateTaskInState(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update priority");
    } finally {
      setActionTaskId("");
    }
  };

  const updateTaskTag = async (task, tagId) => {
    const currentTagId = task.tag?._id || UNTAGGED_COLUMN_ID;
    const nextColumnId = tagId || UNTAGGED_COLUMN_ID;

    if (currentTagId === nextColumnId) return;

    try {
      setActionTaskId(task._id);
      const res = await axios.put(
        `${API_URL}/task/update/${task._id}`,
        { tag: tagId || "" },
        { headers },
      );
      updateTaskInState(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update task tag");
    } finally {
      setActionTaskId("");
    }
  };

  const handleBoardDragEnd = ({ active, over }) => {
    if (!over) return;

    const task = tasks.find((item) => item._id === active.id);
    if (!task) return;

    const nextTagId = over.id === UNTAGGED_COLUMN_ID ? "" : over.id;
    updateTaskTag(task, nextTagId);
  };

  const softDeleteTask = async (taskId) => {
    try {
      setActionTaskId(taskId);
      const res = await axios.patch(`${API_URL}/task/soft-delete/${taskId}`, {}, { headers });
      updateTaskInState(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to soft delete task");
    } finally {
      setActionTaskId("");
    }
  };

  const restoreTask = async (taskId) => {
    try {
      setActionTaskId(taskId);
      const res = await axios.patch(`${API_URL}/task/restore/${taskId}`, {}, { headers });
      updateTaskInState(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore task");
    } finally {
      setActionTaskId("");
    }
  };

  const deleteTask = async (task) => {
    const ok = window.confirm(`Delete "${task.taskName}" permanently?`);
    if (!ok) return;

    try {
      setActionTaskId(task._id);
      await axios.delete(`${API_URL}/task/delete/${task._id}`, { headers });
      setTasks((prev) => prev.filter((item) => item._id !== task._id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete task");
    } finally {
      setActionTaskId("");
    }
  };

  const uploadBulkTasks = async (e) => {
    e.preventDefault();

    if (!bulkFile) {
      return alert("Please select a bulk upload file");
    }

    const formData = new FormData();
    formData.append("file", bulkFile);

    try {
      setBulkLoading(true);
      const res = await axios.post(`${API_URL}/task/bulk-upload`, formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setBulkResult(res.data);
      setBulkFile(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload bulk tasks");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadBulkTemplate = async () => {
    try {
      setTemplateLoading(true);
      const sourceUsers =
        users.length > 0
          ? users
          : (
              await axios.get(`${API_URL}/user/all`, {
                headers,
              })
            ).data.users || [];

      if (sourceUsers.length === 0) {
        alert("No users found for the sample file");
        return;
      }

      const escapeCsvCell = (value = "") => {
        const text = String(value).replace(/"/g, '""');
        return `"${text}"`;
      };

      const activeUsers = sourceUsers.filter((user) => user.status === "active");
      const headers = [
        "taskName",
        "deadline",
        "priority",
        "note",
        "assignedEmail",
        "assignedName",
        "role",
      ];
      const rows = activeUsers.map((user) =>
        [
          "",
          "",
          "medium",
          "",
          user.email,
          user.name,
          user.role,
        ]
          .map(escapeCsvCell)
          .join(","),
      );
      const csv = [
        headers.join(","),
        ...rows,
      ].join("\r\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bulk-task-template.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download sample file");
    } finally {
      setTemplateLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "pending") {
      return "bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-950/70 dark:text-red-200 dark:ring-red-800/70";
    }
    if (status === "progress") {
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:ring-amber-800/70";
    }
    if (status === "completed") {
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-800/70";
    }
    if (status === "inactive") {
      return "bg-slate-200 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
    }
    return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  };

  const getPriorityColor = (priority) => {
    if (priority === "high") {
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:ring-rose-800/70";
    }
    if (priority === "medium") {
      return "bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-200 dark:ring-sky-800/70";
    }
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
  };

  const renderPriorityControl = (task, isBusy) => (
    <select
      value={task.priority || "medium"}
      onChange={(e) => updateTaskPriority(task, e.target.value)}
      disabled={isBusy}
      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getPriorityColor(
        task.priority,
      )}`}
    >
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    progress: tasks.filter((task) => task.status === "progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    inactive: tasks.filter((task) => task.status === "inactive").length,
    overdue: tasks.filter(
      (task) =>
        task.deadline &&
        new Date(task.deadline) < new Date() &&
        task.status !== "completed" &&
        task.status !== "inactive",
    ).length,
  };

  const userStats = {
    total: users.length,
    active: users.filter((user) => user.status === "active").length,
    inactive: users.filter((user) => user.status === "inactive").length,
    admin: users.filter((user) => user.role === "admin").length,
  };

  const taskChartData = [
    { label: "Pending", value: taskStats.pending, color: "bg-red-500" },
    { label: "Progress", value: taskStats.progress, color: "bg-yellow-400" },
    { label: "Completed", value: taskStats.completed, color: "bg-green-500" },
    { label: "Inactive", value: taskStats.inactive, color: "bg-gray-400" },
  ];

  const completedPercent =
    taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const boardColumns = [
    {
      id: UNTAGGED_COLUMN_ID,
      name: "Untagged",
      color: "bg-slate-500",
      tasks: tasks.filter((task) => !task.tag?._id),
    },
    ...tags.map((tag) => ({
      id: tag._id,
      name: tag.name,
      color: tag.color || "bg-slate-700",
      tasks: tasks.filter((task) => task.tag?._id === tag._id),
    })),
  ].map((column) => ({
    ...column,
    count: column.tasks.length,
  }));

  const today = new Date();
  const calendarYear = today.getFullYear();
  const calendarMonth = today.getMonth();
  const calendarMonthName = today.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarStartOffset = firstDayOfMonth.getDay();
  const calendarCells = [
    ...Array(calendarStartOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.deadline) return acc;

    const key = new Date(task.deadline).toDateString();
    acc[key] = [...(acc[key] || []), task];
    return acc;
  }, {});

  const navButtonClass = (view) =>
    `w-full text-left px-4 py-3 rounded-lg font-medium ${
      active === view
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-500"
        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-300 dark:hover:bg-slate-700/80 dark:hover:text-white"
    }`;

  const isSortActive = (sort) => taskSorts.includes(sort);

  const setSingleSort = (sort) => {
    setTaskSorts([sort]);
  };

  const toggleSort = (sort) => {
    setTaskSorts((prev) => {
      const withoutNewest = prev.filter((item) => item !== "newest");

      if (withoutNewest.includes(sort)) {
        const next = withoutNewest.filter((item) => item !== sort);
        return next.length > 0 ? next : ["newest"];
      }

      return [...withoutNewest, sort];
    });
  };

  const applyAllTaskSorts = () => {
    setTaskSorts(["priority", "status", "assignedTo", "createdBy"]);
  };

  const sortButtonClass = (sort) =>
    `rounded-lg px-3 py-2 text-sm font-semibold ${
      isSortActive(sort)
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-500"
        : "border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
    }`;

  const getUserStatusColor = (isActive) =>
    isActive
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-800/70"
      : "bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-950/70 dark:text-red-200 dark:ring-red-800/70";

  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden bg-transparent">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white/90 p-5 shadow-lg dark:border-gray-800 dark:bg-slate-950/90">
        <h2 className="text-xl font-bold mb-6 text-indigo-600 dark:text-indigo-300">
          Admin Panel
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => setActive("dashboard")}
            className={navButtonClass("dashboard")}
          >
            Dashboard
          </button>

          <button onClick={() => setActive("tasks")} className={navButtonClass("tasks")}>
            All Tasks
          </button>

          <button onClick={() => setActive("users")} className={navButtonClass("users")}>
            All Users
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">
        {active === "dashboard" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Dashboard
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                  Overview of users, tasks, and workload status
                </p>
              </div>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                  {taskStats.total}
                </p>
              </div>

              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed
                </p>
                <p className="mt-3 text-3xl font-bold text-green-600">
                  {taskStats.completed}
                </p>
              </div>

              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Overdue
                </p>
                <p className="mt-3 text-3xl font-bold text-red-600">
                  {taskStats.overdue}
                </p>
              </div>

              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Users
                </p>
                <p className="mt-3 text-3xl font-bold text-indigo-600">
                  {userStats.active}
                </p>
              </div>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-3">
              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800 xl:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Task Status
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {taskStats.total} total
                  </span>
                </div>

                <div className="space-y-4">
                  {taskChartData.map((item) => {
                    const percent =
                      taskStats.total > 0
                        ? Math.round((item.value / taskStats.total) * 100)
                        : 0;

                    return (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {item.label}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {item.value} ({percent}%)
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Completion
                </h3>

                <div className="mt-6 flex justify-center">
                  <div
                    className="grid h-44 w-44 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#22c55e ${completedPercent * 3.6}deg, var(--surface-muted) 0deg)`,
                    }}
                  >
                    <div className="grid h-32 w-32 place-items-center rounded-full bg-white dark:bg-gray-800">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {completedPercent}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                    <p className="text-gray-500 dark:text-gray-300">Pending</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {taskStats.pending}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                    <p className="text-gray-500 dark:text-gray-300">Progress</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {taskStats.progress}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-white p-5 shadow dark:bg-gray-800">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Task Calendar
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Deadlines for {calendarMonthName}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {taskStats.overdue} overdue
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {calendarCells.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-24 rounded-lg border border-dashed border-gray-200 dark:border-gray-700"
                      />
                    );
                  }

                  const date = new Date(calendarYear, calendarMonth, day);
                  const dateTasks = tasksByDate[date.toDateString()] || [];
                  const isToday = date.toDateString() === today.toDateString();

                  return (
                    <div
                      key={day}
                      className={`min-h-24 rounded-lg border p-2 ${
                        isToday
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            isToday
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {day}
                        </span>
                        {dateTasks.length > 0 && (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            {dateTasks.length}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {dateTasks.slice(0, 2).map((task) => (
                          <div
                            key={task._id}
                            className={`truncate rounded px-2 py-1 text-left text-xs font-medium ${getStatusColor(
                              task.status,
                            )}`}
                            title={task.taskName}
                          >
                            {task.taskName}
                          </div>
                        ))}
                        {dateTasks.length > 2 && (
                          <p className="text-left text-xs text-gray-500 dark:text-gray-400">
                            +{dateTasks.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-2">
              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  Recent Tasks
                </h3>
                <div className="space-y-3">
                  {recentTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No recent tasks
                    </p>
                  ) : (
                    recentTasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-700"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {task.taskName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {task.assignedTo?.name || "Unknown"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(
                              task.priority,
                            )}`}
                          >
                            {task.priority || "medium"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                              task.status,
                            )}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  User Summary
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-950">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {userStats.active}
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      Active
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-950">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {userStats.inactive}
                    </p>
                    <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                      Inactive
                    </p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-4 text-center dark:bg-indigo-950">
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {userStats.admin}
                    </p>
                    <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                      Admin
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No users found
                    </p>
                  ) : (
                    recentUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-700"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {user.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {active === "tasks" && (
          <>
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  All Tasks
                </h2>
                <input
                  type="search"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks, status, priority, assigned user..."
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:w-96"
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSingleSort("newest")}
                  className={sortButtonClass("newest")}
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className={sortButtonClass("status")}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort("priority")}
                  className={sortButtonClass("priority")}
                >
                  Priority
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort("assignedTo")}
                  className={sortButtonClass("assignedTo")}
                >
                  Assign To
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort("createdBy")}
                  className={sortButtonClass("createdBy")}
                >
                  Assign By
                </button>
                <button
                  type="button"
                  onClick={applyAllTaskSorts}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    isSortActive("status") &&
                    isSortActive("priority") &&
                    isSortActive("assignedTo") &&
                    isSortActive("createdBy")
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-500"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setSingleSort("deadline")}
                  className={sortButtonClass("deadline")}
                >
                  Deadline
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {tasks.length} {taskSearch.trim() ? "matched" : ""} tasks
                </span>
                <button
                  type="button"
                  onClick={showTaskCardView}
                  className={taskViewButtonClass("card")}
                >
                  Board
                </button>
                <button
                  type="button"
                  onClick={showTaskTableView}
                  className={taskViewButtonClass("table")}
                >
                  Table
                </button>
              </div>
            </div>

            <section className="mb-6 rounded-lg bg-white p-5 shadow dark:bg-gray-800">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Task Tags
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Create columns for the board, then drag tasks between tags.
                  </p>
                </div>

                <form onSubmit={createTag} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="New tag name"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={creatingTag}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingTag ? "Creating..." : "Create Tag"}
                  </button>
                </form>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {loadingTags ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Loading tags...
                  </span>
                ) : tags.length === 0 ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    No tags yet
                  </span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag._id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600"
                    >
                      {tag.name}
                    </span>
                  ))
                )}
              </div>
            </section>

            <section className="mb-6 rounded-lg bg-white p-5 shadow dark:bg-gray-800">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Bulk Upload Tasks
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Download the sample file, open it in Excel, fill taskName,
                    deadline, priority, and note for the listed users, then upload it.
                  </p>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <button
                    type="button"
                    onClick={downloadBulkTemplate}
                    disabled={templateLoading}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-400/40 dark:bg-indigo-950/60 dark:text-indigo-200 dark:hover:bg-indigo-900/70"
                  >
                    {templateLoading ? "Preparing..." : "Download Sample File"}
                  </button>
                  <form onSubmit={uploadBulkTasks} className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        setBulkFile(e.target.files?.[0] || null);
                        setBulkResult(null);
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={bulkLoading}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {bulkLoading ? "Uploading..." : "Upload XLSX"}
                    </button>
                  </form>
                </div>
              </div>

              {bulkResult && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-900">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Imported {bulkResult.createdCount} tasks. Failed{" "}
                    {bulkResult.failedCount} rows.
                  </p>
                  {bulkResult.failedRows?.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-auto text-gray-600 dark:text-gray-300">
                      {bulkResult.failedRows.map((row) => (
                        <p key={`${row.row}-${row.message}`}>
                          Row {row.row}: {row.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {loadingTasks ? (
              <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No tasks found</p>
            ) : isTaskTableView ? (
              <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Assigned</th>
                      <th className="px-4 py-3">Created By</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tasks.map((task) => {
                      const isBusy = actionTaskId === task._id;

                      return (
                        <tr key={task._id} className="text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {task.taskName}
                            </p>
                            <p className="mt-1 max-w-sm text-gray-500 dark:text-gray-400">
                              {task.note}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                                task.status,
                              )}`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {renderPriorityControl(task, isBusy)}
                          </td>
                          <td className="px-4 py-3">{task.assignedTo?.name || "Unknown"}</td>
                          <td className="px-4 py-3">{task.createdBy?.name || "Unknown"}</td>
                          <td className="px-4 py-3">
                            {task.deadline
                              ? new Date(task.deadline).toLocaleDateString()
                              : "No deadline"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-56 flex-wrap gap-2">
                              {getTaskImageUrl(task) && (
                                <a
                                  href={getTaskImageUrl(task)}
                                  download={getTaskImageName(task)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
                                >
                                  Download Image
                                </a>
                              )}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  startEditTask(task);
                                  showTaskCardView();
                                }}
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit
                              </button>
                              {task.status === "inactive" ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => restoreTask(task._id)}
                                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Restore
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy || task.status === "completed"}
                                  onClick={() => softDeleteTask(task._id)}
                                  className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Soft Delete
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => deleteTask(task)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <DndContext onDragEnd={handleBoardDragEnd}>
                <div className="w-full max-w-full overflow-x-auto pb-3">
                  <div className="flex w-max gap-4">
                  {boardColumns.map((column) => (
                    <BoardColumn key={column.id} column={column}>
                      {column.tasks.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          Drop tasks here
                        </div>
                      ) : (
                        column.tasks.map((task) => {
                          const isEditing = editingTaskId === task._id;
                          const isBusy = actionTaskId === task._id;
                          const activeUsers = users.filter(
                            (user) => user.status === "active",
                          );

                          return (
                            <DraggableTaskCard
                              key={task._id}
                              task={task}
                              isBusy={isBusy || isEditing}
                            >
                              {isEditing ? (
                                <div className="space-y-3">
                                  <input
                                    type="text"
                                    name="taskName"
                                    value={taskForm.taskName}
                                    onChange={setTaskData}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  />

                                  <input
                                    type="date"
                                    name="deadline"
                                    value={taskForm.deadline}
                                    onChange={setTaskData}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  />

                                  <select
                                    name="priority"
                                    value={taskForm.priority}
                                    onChange={setTaskData}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  >
                                    <option value="high">High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                  </select>

                                  <select
                                    name="assignedTo"
                                    value={taskForm.assignedTo}
                                    onChange={setTaskData}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  >
                                    <option value="">Reassign user</option>
                                    {activeUsers.map((user) => (
                                      <option key={user._id} value={user._id}>
                                        {user.name} ({user.email})
                                      </option>
                                    ))}
                                  </select>

                                  <select
                                    name="status"
                                    value={taskForm.status}
                                    onChange={setTaskData}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="progress">Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="inactive">Inactive</option>
                                  </select>

                                  <textarea
                                    name="note"
                                    value={taskForm.note}
                                    onChange={setTaskData}
                                    rows="3"
                                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  />

                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => updateTask(task._id)}
                                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Update
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => setEditingTaskId("")}
                                      className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                      {task.taskName}
                                    </h3>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                      {renderPriorityControl(task, isBusy)}
                                      <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                                          task.status,
                                        )}`}
                                      >
                                        {task.status}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                                    {task.note}
                                  </p>

                                  <div className="mt-4 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                    <p>Assigned: {task.assignedTo?.name || "Unknown"}</p>
                                    <p>Tag: {task.tag?.name || "Untagged"}</p>
                                    <p>
                                      Deadline:{" "}
                                      {task.deadline
                                        ? new Date(task.deadline).toLocaleDateString()
                                        : "No deadline"}
                                    </p>
                                  </div>

                                  <div className="mt-5 grid grid-cols-2 gap-3">
                                    {getTaskImageUrl(task) && (
                                      <a
                                        href={getTaskImageUrl(task)}
                                        download={getTaskImageName(task)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="col-span-2 rounded-lg bg-slate-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
                                      >
                                        Download Image
                                      </a>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => startEditTask(task)}
                                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Edit
                                    </button>

                                    {task.status === "inactive" ? (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => restoreTask(task._id)}
                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Restore
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={isBusy || task.status === "completed"}
                                        onClick={() => softDeleteTask(task._id)}
                                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Soft Delete
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => deleteTask(task)}
                                      className="col-span-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </DraggableTaskCard>
                          );
                        })
                      )}
                    </BoardColumn>
                  ))}
                  </div>
                </div>
              </DndContext>
            )}
          </>
        )}

        {active === "users" && (
          <>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  All Users
                </h2>
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users, email, role, status..."
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:w-80"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {users.length} {userSearch.trim() ? "matched" : ""} users
                </span>
                <button
                  type="button"
                  onClick={showUserCardView}
                  className={userViewButtonClass("card")}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={showUserTableView}
                  className={userViewButtonClass("table")}
                >
                  Table
                </button>
              </div>
            </div>

            <form
              onSubmit={createUser}
              className="mb-5 grid gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <input
                type="text"
                name="name"
                value={userForm.name}
                onChange={setUserData}
                placeholder="User name"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="email"
                name="email"
                value={userForm.email}
                onChange={setUserData}
                placeholder="Email address"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="password"
                name="password"
                value={userForm.password}
                onChange={setUserData}
                placeholder="Password"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={creatingUser}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingUser ? "Creating..." : "Add User"}
              </button>
            </form>

            {loadingUsers ? (
              <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No users found</p>
            ) : isUserTableView ? (
              <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map((user) => {
                      const isBusy = actionUserId === user._id;
                      const isActive = user.status === "active";
                      const isAdmin = user.role === "admin";

                      return (
                        <tr key={user._id} className="text-gray-700 dark:text-gray-300">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">{user.role}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getUserStatusColor(
                                isActive,
                              )}`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-40 gap-2">
                              <button
                                type="button"
                                disabled={isBusy || isAdmin}
                                onClick={() => toggleUserStatus(user)}
                                className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                                  isActive
                                    ? "bg-amber-500 hover:bg-amber-600"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {isActive ? "Inactive" : "Active"}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy || isAdmin}
                                onClick={() => deleteUser(user)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {users.map((user) => {
                  const isBusy = actionUserId === user._id;
                  const isActive = user.status === "active";
                  const isAdmin = user.role === "admin";

                  return (
                    <article
                      key={user._id}
                      className="rounded-lg bg-white dark:bg-gray-800 shadow p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${getUserStatusColor(
                            isActive,
                          )}`}
                        >
                          {user.status}
                        </span>
                      </div>

                      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                        Role: <span className="font-medium">{user.role}</span>
                      </p>

                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          disabled={isBusy || isAdmin}
                          onClick={() => toggleUserStatus(user)}
                          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {isActive ? "Inactive" : "Active"}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy || isAdmin}
                          onClick={() => deleteUser(user)}
                          className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
