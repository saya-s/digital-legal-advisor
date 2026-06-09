import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import ResetPassword from "./pages/Auth/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Landing from "./pages/Landing/Landing.jsx";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy.jsx";
import TermsOfService from "./pages/Legal/TermsOfService.jsx";

import Lawyers from "./pages/Lawyers/Lawyers.jsx";
import LawyerProfile from "./pages/Lawyers/LawyerProfile.jsx";
import LegalDictionary from "./pages/LegalDictionary/LegalDictionary.jsx";
import Compare from "./pages/Compare/Compare.jsx";
import CompareResults from "./pages/Compare/CompareResults.jsx";
import QA from "./pages/QA/QA.jsx";
import Templates from "./pages/Templates/Templates.jsx";
import Upload from "./pages/Upload/Upload.jsx";

// Get the Google sign-in id saved in the project settings.
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Wire the app providers and match each URL to the correct page component.
// In simple terms: this file decides which page opens for each website address.
function App() {
  return (
    // Make Google login available to any page that needs it.
    // This allows the login and register pages to use Google sign-in.
    <GoogleOAuthProvider clientId={googleClientId}>
      {/* Enable URL-based page navigation across the whole app. */}
      <BrowserRouter>
        {/* Show only the page that matches the current website address. */}
        <Routes>
          {/* Public pages anyone can open. */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          
          {/* Protected pages only render if the user has a valid session. */}
          {/* In simple terms: these pages send signed-out users to Login. */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <Compare />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare/results"
            element={
              <ProtectedRoute>
                <CompareResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qa"
            element={
              <ProtectedRoute>
                <QA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dictionary"
            element={
              <ProtectedRoute>
                <LegalDictionary />
              </ProtectedRoute>
            }
          />
          
          {/* These pages stay visible before sign-in as part of the public experience. */}
          <Route path="/templates" element={<Templates />} />
          <Route path="/lawyers" element={<Lawyers />} />
          {/* One specific lawyer profile is still gated even though the directory is public. */}
          {/* In simple terms: a full lawyer profile requires sign-in. */}
          {/* :lawyerId is replaced by the chosen lawyer's number, such as /lawyers/12. */}
          <Route
            path="/lawyers/:lawyerId"
            element={
              <ProtectedRoute>
                <LawyerProfile />
              </ProtectedRoute>
            }
          />
          {/* Unknown URLs fall back to the landing page instead of breaking. */}
          {/* The * matches every URL that was not matched above. */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
