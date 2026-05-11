import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useTheme from "../custom_hook/UseTheme";

const ThemeIcon = ({ theme }) => {
  if (theme === "dark") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M12 3a6.6 6.6 0 0 0 8.8 8.8A8.8 8.8 0 1 1 12 3Z" />
    </svg>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [, refreshProfilePhoto] = useState(0);
  const profileRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const isLoggedIn = Boolean(token);
  const isAdmin = user?.role === "admin";
  const dashboardPath = isAdmin ? "/admin" : "/userDashborad";
  const authPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/forgetPassword",
    "/verifyOtp",
    "/reset-forgot-password",
  ];
  const isAuthPath = authPaths.includes(location.pathname);
  const userStorageKey = user?._id || user?.email || "guest";
  const profilePhoto = isLoggedIn
    ? localStorage.getItem(`profilePhoto:${userStorageKey}`) || ""
    : "";

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

  useEffect(() => {
    if (!isLoggedIn) {
      document.body.classList.remove("has-dashboard-background");
      document.body.style.removeProperty("--dashboard-background-image");
      return;
    }

    const savedBackground = localStorage.getItem(
      `dashboardBackground:${userStorageKey}`,
    );

    if (savedBackground) {
      document.body.style.setProperty(
        "--dashboard-background-image",
        `url(${JSON.stringify(savedBackground)})`,
      );
      document.body.classList.add("has-dashboard-background");
    } else {
      document.body.classList.remove("has-dashboard-background");
      document.body.style.removeProperty("--dashboard-background-image");
    }
  }, [isLoggedIn, userStorageKey]);

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

  const openBackgroundPicker = () => {
    setProfileOpen(false);
    backgroundInputRef.current?.click();
  };

  const openProfilePhotoPicker = () => {
    setProfileOpen(false);
    profilePhotoInputRef.current?.click();
  };

  const readImageFile = (file, onLoad, sizeErrorMessage) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        onLoad(reader.result);
      } catch {
        alert(sizeErrorMessage);
      }
    };

    reader.onerror = () => {
      alert("Failed to load image.");
    };

    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    readImageFile(file, (imageData) => {
      localStorage.setItem(`dashboardBackground:${userStorageKey}`, imageData);
      document.body.style.setProperty(
        "--dashboard-background-image",
        `url(${JSON.stringify(imageData)})`,
      );
      document.body.classList.add("has-dashboard-background");
    }, "Image is too large. Please choose a smaller background image.");
  };

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    readImageFile(file, (imageData) => {
      localStorage.setItem(`profilePhoto:${userStorageKey}`, imageData);
      refreshProfilePhoto((version) => version + 1);
    }, "Profile photo is too large. Please choose a smaller image.");
  };

  return (
    <nav className="premium-nav transition duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(isLoggedIn ? dashboardPath : "/login")}
          className="flex items-center gap-3 rounded-lg text-left"
        >
          <span className="brand-mark">TM</span>
          <span>
            <span className="block text-lg font-extrabold text-gray-900 dark:text-white">
              Task Manager
            </span>
            <span className="hidden text-xs font-semibold text-gray-500 dark:text-gray-400 sm:block">
              Work control center
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          {!isLoggedIn ? (
            !isAuthPath && (
              <Link to="/login" className="header-action-link">
                Login
              </Link>
            )
          ) : (
            <>
              <Link
                to="/dashboard"
                className="nav-link"
              >
                Dashboard
              </Link>

              <Link
                to="/add-task"
                className="nav-link"
              >
                Add Task
              </Link>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                  className="grid h-11 w-11 overflow-hidden rounded-lg border border-teal-200 bg-teal-700 text-sm font-bold text-white shadow-sm shadow-teal-700/20 hover:bg-teal-800 dark:border-teal-400/40 dark:bg-teal-500 dark:hover:bg-teal-400"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                {profileOpen && (
                  <div className="section-card absolute right-0 top-14 z-30 w-72 overflow-hidden">
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-teal-700 text-sm font-bold text-white">
                          {profilePhoto ? (
                            <img
                              src={profilePhoto}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="m-auto">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-white">
                            {user?.name || "User"}
                          </p>
                          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                          {user?.role && (
                            <p className="mt-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold capitalize text-teal-800 dark:bg-teal-950/70 dark:text-teal-200">
                              {user.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/admin");
                          }}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:text-gray-200 dark:hover:bg-teal-950/40 dark:hover:text-white"
                        >
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={goToEditProfile}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:text-gray-200 dark:hover:bg-teal-950/40 dark:hover:text-white"
                      >
                        Edit Profile
                      </button>
                      <button
                        type="button"
                        onClick={openProfilePhotoPicker}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:text-gray-200 dark:hover:bg-teal-950/40 dark:hover:text-white"
                      >
                        Add Profile Photo
                      </button>
                      <button
                        type="button"
                        onClick={goToResetPassword}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:text-gray-200 dark:hover:bg-teal-950/40 dark:hover:text-white"
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={openBackgroundPicker}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-teal-50 hover:text-teal-800 dark:text-gray-200 dark:hover:bg-teal-950/40 dark:hover:text-white"
                      >
                        Add Background
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

          {isLoggedIn && (
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
          )}

          {isLoggedIn && (
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoUpload}
              className="hidden"
            />
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="theme-toggle"
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
