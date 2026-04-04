import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Login from "./pages/Auth/Login.jsx";
import Register from "./pages/Auth/Register.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Landing from "./pages/Landing/Landing.jsx";
import LawyerProfile from "./pages/Lawyers/LawyerProfile.jsx";
import Lawyers from "./pages/Lawyers/Lawyers.jsx";
import LegalDictionary from "./pages/LegalDictionary/LegalDictionary.jsx";
import QA from "./pages/QA/QA.jsx";
import Templates from "./pages/Templates/Templates.jsx";
import Upload from "./pages/Upload/Upload.jsx";

function App() {
  return (
  
    <GoogleOAuthProvider clientId="125827197507-kh7gnlkr2595ful32npvfd5sq8a8jiof.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
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
          
          {/* Public pages can be browsed before sign-in. */}
          <Route path="/templates" element={<Templates />} />
          <Route path="/lawyers" element={<Lawyers />} />
          {/* Full lawyer profiles are gated behind sign-in. */}
          <Route
            path="/lawyers/:lawyerId"
            element={
              <ProtectedRoute>
                <LawyerProfile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
