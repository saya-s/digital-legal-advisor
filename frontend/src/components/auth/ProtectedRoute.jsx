import { Navigate, useLocation } from "react-router-dom";
import { getAuthSession } from "../../utils/authSession.js";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/login" replace state={{ from: redirectTo }} />;
  }

  return children;
}
