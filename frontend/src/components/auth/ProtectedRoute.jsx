import { Navigate, useLocation } from "react-router-dom";
import { getAuthSession } from "../../utils/authSession.js";

// This stops signed-out users from opening protected pages.
export default function ProtectedRoute({ children }) {
  // Remember the exact page the user tried to open.
  const location = useLocation();
  // getAuthSession returns saved login details or null.
  const session = getAuthSession();

  if (!session) {
    // Remember this page so login can bring the user back here.
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;

    // Tell Login where to return the user after sign-in.
    return <Navigate to="/login" replace state={{ from: redirectTo }} />;
  }

  // If the user is signed in, show the page.
  return children;
}
