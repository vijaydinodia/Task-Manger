import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const CreateAccount = () => {
  return (
    <AuthLayout
      kicker="Create account"
      title="Ask your admin to create your account"
      subtitle="Direct signup is disabled for this workspace. Your admin can add you from the admin dashboard and email your login details."
      footer={
        <Link
          to="/forgot-password"
          className="block text-center text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
        >
          Already have an account?
        </Link>
      }
    >
      <Link to="/login" className="theme-btn">
        Back to Login
      </Link>
    </AuthLayout>
  );
};

export default CreateAccount;
