import { Navigate, useLocation } from "react-router-dom";
import { hasAuthSession } from "../../utils/authSession.js";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAuthSession()) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/login" replace state={{ from: redirectTo }} />;
  }

  return children;
}
