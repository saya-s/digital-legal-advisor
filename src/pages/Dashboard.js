import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dash-bg">
      <div className="dash-container">

        {/* TOP NAV */}
        <div className="dash-top">
          <h2>Digital Legal Advisor</h2>
          <div>
            <button
              className="nav-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="nav-btn primary"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* MAIN CARDS */}
        <div className="dash-grid">

          <button
            className="dash-card"
            onClick={() => navigate("/upload")}
          >
            <h3>Upload & Analyze</h3>
            <p>Upload a contract and get summary, explanation, and risk score.</p>
          </button>

          <button
            className="dash-card"
            onClick={() => navigate("/qa")}
          >
            <h3>Ask a Question</h3>
            <p>Ask legal questions and get AI-assisted guidance.</p>
          </button>

          <button
            className="dash-card"
            onClick={() => navigate("/templates")}
          >
            <h3>Contract Templates</h3>
            <p>Browse ready-made templates and filter by category.</p>
          </button>

          <button
            className="dash-card"
            onClick={() => navigate("/lawyers")}
          >
            <h3>Find a Lawyer</h3>
            <p>Search lawyers by city and specialty.</p>
          </button>

        </div>
      </div>
    </div>
  );
}