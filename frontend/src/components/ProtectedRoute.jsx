import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const dashboardPath = user?.role === "admin" ? "/admin" : "/userDashborad";

  if (!token) return <Navigate to="/login" />;

  if (role && user?.role !== role) {
    return <Navigate to={dashboardPath} />;
  }

  return children;
};

export default ProtectedRoute;
