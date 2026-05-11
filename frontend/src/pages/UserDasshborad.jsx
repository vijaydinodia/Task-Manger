import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import useTableview from "../custom_hook/UseTableview";

const API_URL = "http://localhost:5000";
const priorityOrder = { high: 1, medium: 2, low: 3 };

const UserDasshborad = () => {
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [actionTaskId, setActionTaskId] = useState("");
  const { isTableView, viewButtonClass, showCardView, showTableView } =
    useTableview();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const isMyTask = useCallback(
    (task) => {
      const assignedId = task.assignedTo?._id?.toString();
      const createdId = task.createdBy?._id?.toString();
      const assignedEmail = task.assignedTo?.email;
      const createdEmail = task.createdBy?.email;

      return (
        assignedId === user?._id ||
        createdId === user?._id ||
        assignedEmail === user?.email ||
        createdEmail === user?.email
      );
    },
    [user?._id, user?.email],
  );

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/task/my-tasks`, { headers });
      const myTasks = (res.data.data || [])
        .filter(isMyTask)
        .sort((a, b) => {
          const priorityResult =
            (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
          if (priorityResult !== 0) return priorityResult;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
      setTasks(myTasks);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [headers, isMyTask]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const updateTaskInState = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)),
    );
  };

  const runTaskAction = async (taskId, action, fallbackMessage) => {
    try {
      setActionTaskId(taskId);
      const res = await axios.patch(`${API_URL}/task/${action}/${taskId}`, {}, { headers });
      updateTaskInState(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || fallbackMessage);
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

  const stats = useMemo(
    () => ({
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
    }),
    [tasks],
  );

  const filteredTasks = [...(activeFilter === "all"
    ? tasks
    : tasks.filter((task) => task.status === activeFilter)
  )].sort((a, b) => {
    const priorityResult =
      (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    if (priorityResult !== 0) return priorityResult;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const taskChartData = [
    { label: "Pending", value: stats.pending, color: "bg-red-500" },
    { label: "Progress", value: stats.progress, color: "bg-yellow-400" },
    { label: "Completed", value: stats.completed, color: "bg-green-500" },
    { label: "Inactive", value: stats.inactive, color: "bg-gray-400" },
  ];

  const completedPercent =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

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

  const filterButtonClass = (filter) =>
    `rounded-lg px-4 py-2 text-sm font-semibold ${
      activeFilter === filter
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 dark:bg-indigo-500"
        : "border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
    }`;

  const isCreator = (task) =>
    task.createdBy?._id === user?._id || task.createdBy?.email === user?.email;

  const isAssignee = (task) =>
    task.assignedTo?._id === user?._id || task.assignedTo?.email === user?.email;

  const getTaskImageUrl = (task) => task.image?.downloadUrl || task.image?.url || "";

  const getTaskImageName = (task) =>
    task.image?.originalName || `${task.taskName || "task"}-image`;

  const getTaskRelation = (task) => {
    const assignedToMe =
      task.assignedTo?._id === user?._id || task.assignedTo?.email === user?.email;
    const createdByMe = isCreator(task);

    if (assignedToMe && createdByMe) return "Assigned by you to yourself";
    if (assignedToMe) return "Assigned to you";
    if (createdByMe) return "Assigned by you";
    return "";
  };

  const renderPriorityControl = (task, isBusy) =>
    isAssignee(task) ? (
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
    ) : (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(
          task.priority,
        )}`}
      >
        {task.priority || "medium"}
      </span>
    );

  return (
    <div className="min-h-screen bg-transparent px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Track assigned tasks, start work, and mark progress.
            </p>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {user?.email}
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.pending}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Progress</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.progress}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800 xl:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                My Task Status
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stats.total} total
              </span>
            </div>

            <div className="space-y-4">
              {taskChartData.map((item) => {
                const percent =
                  stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;

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
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Completion
            </h2>

            <div className="mt-6 flex justify-center">
              <div
                className="grid h-44 w-44 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(#22c55e ${
                    completedPercent * 3.6
                  }deg, var(--surface-muted) 0deg)`,
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
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
                <p className="text-red-700 dark:text-red-300">Pending</p>
                <p className="mt-1 font-semibold text-red-700 dark:text-red-300">
                  {stats.pending}
                </p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
                <p className="text-yellow-700 dark:text-yellow-300">Progress</p>
                <p className="mt-1 font-semibold text-yellow-700 dark:text-yellow-300">
                  {stats.progress}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveFilter("all")} className={filterButtonClass("all")}>
              All
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={filterButtonClass("pending")}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter("progress")}
              className={filterButtonClass("progress")}
            >
              Progress
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={filterButtonClass("completed")}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveFilter("inactive")}
              className={filterButtonClass("inactive")}
            >
              Inactive
            </button>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={showCardView} className={viewButtonClass("card")}>
              Card
            </button>
            <button type="button" onClick={showTableView} className={viewButtonClass("table")}>
              Table
            </button>
          </div>
        </div>

        <section className="mt-6">
          {loading ? (
            <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white">
                No tasks found
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tasks assigned to you or created by you will appear here.
              </p>
            </div>
          ) : isTableView ? (
            <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-100 text-xs uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Relation</th>
                    <th className="px-4 py-3">Assigned To</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3">Deadline</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTasks.map((task) => {
                    const isBusy = actionTaskId === task._id;
                    const creator = isCreator(task);

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
                        <td className="px-4 py-3">{getTaskRelation(task)}</td>
                        <td className="px-4 py-3">{task.assignedTo?.name || "Unknown"}</td>
                        <td className="px-4 py-3">{task.createdBy?.name || "Unknown"}</td>
                        <td className="px-4 py-3">
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString()
                            : "No deadline"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-40 flex-wrap gap-2">
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
                            {task.status === "pending" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  runTaskAction(task._id, "start", "Failed to start task")
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Start
                              </button>
                            )}
                            {task.status === "progress" && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  runTaskAction(
                                    task._id,
                                    "complete",
                                    "Failed to complete task",
                                  )
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Complete
                              </button>
                            )}
                            {task.status === "inactive" && creator && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  runTaskAction(
                                    task._id,
                                    "restore",
                                    "Failed to restore task",
                                  )
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Restore
                              </button>
                            )}
                            {task.status !== "completed" &&
                              task.status !== "inactive" &&
                              creator && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    runTaskAction(
                                      task._id,
                                      "soft-delete",
                                      "Failed to soft delete task",
                                    )
                                  }
                                  className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Soft Delete
                                </button>
                              )}
                            {creator && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => deleteTask(task)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
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
              {filteredTasks.map((task) => {
                const isBusy = actionTaskId === task._id;
                const creator = isCreator(task);

                return (
                  <article
                    key={task._id}
                    className="rounded-lg bg-white p-5 shadow dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-gray-900 dark:text-white">
                        {task.taskName}
                      </h2>
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
                      <p className="font-medium text-indigo-600 dark:text-indigo-300">
                        {getTaskRelation(task)}
                      </p>
                      <p>Assigned to: {task.assignedTo?.name || "Unknown"}</p>
                      <p>Created by: {task.createdBy?.name || "Unknown"}</p>
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

                      {task.status === "pending" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runTaskAction(task._id, "start", "Failed to start task")
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Start
                        </button>
                      )}

                      {task.status === "progress" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runTaskAction(task._id, "complete", "Failed to complete task")
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Complete
                        </button>
                      )}

                      {task.status === "inactive" && creator && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runTaskAction(task._id, "restore", "Failed to restore task")
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}

                      {task.status !== "completed" && task.status !== "inactive" && creator && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            runTaskAction(
                              task._id,
                              "soft-delete",
                              "Failed to soft delete task",
                            )
                          }
                          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Soft Delete
                        </button>
                      )}

                      {creator && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => deleteTask(task)}
                          className="col-span-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDasshborad;
