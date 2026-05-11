import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

// Components
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import AddTask from "./components/AddTask";
import EditProfile from "./components/EditProfile";

// Dashboards
import UserDasshborad from "./pages/UserDasshborad";
import AdminDashboard from "./pages/AdminDashboard";

const getDashboardPath = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.role === "admin" ? "/admin" : "/userDashborad";
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return children;
};

const DashboardRedirect = () => <Navigate to={getDashboardPath()} replace />;

const App = () => {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/signup" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resetPassword"
          element={
            <ProtectedRoute>
              <ResetPassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-task"
          element={
            <ProtectedRoute>
              <AddTask />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/userDashborad"
          element={
            <ProtectedRoute>
              <UserDasshborad />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <h1 className="text-center mt-10 text-xl font-bold">
              404 - Page Not Found ❌
            </h1>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
