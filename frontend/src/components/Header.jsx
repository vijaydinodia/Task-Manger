import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTheme from "../custom_hook/UseTheme";

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const isLoggedIn = Boolean(token);
  const isAdmin = user?.role === "admin";
  const dashboardPath = isAdmin ? "/admin" : "/userDashborad";

  const initials = (user?.name || user?.email || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currUsername");
    setProfileOpen(false);
    navigate("/login");
  };

  const goToEditProfile = () => {
    setProfileOpen(false);
    navigate("/edit-profile");
  };

  const goToResetPassword = () => {
    setProfileOpen(false);
    navigate("/resetPassword");
  };

  return (
    <nav className="bg-white/85 transition duration-300 dark:bg-slate-950/85">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1
          onClick={() => navigate(isLoggedIn ? dashboardPath : "/login")}
          className="text-xl font-bold cursor-pointer text-gray-800 dark:text-white"
        >
          Task Manager
        </h1>

        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700 transition"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
              >
                Dashboard
              </Link>

              <Link
                to="/add-task"
                className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-300"
              >
                Add Task
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  className="grid h-11 w-11 place-items-center rounded-full border border-indigo-200 bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 dark:border-indigo-400/40 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  {initials}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-14 z-30 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-slate-900">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>
                      {user?.role && (
                        <p className="mt-2 inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-200">
                          {user.role}
                        </p>
                      )}
                    </div>

                    <div className="p-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/admin");
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={goToEditProfile}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={goToResetPassword}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/60"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-800 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-700 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
