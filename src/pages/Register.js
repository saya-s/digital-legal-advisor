import { useState } from "react";
import "./Register.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [agree, setAgree] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!agree) {
      alert("Please agree to the terms.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log({ username, email, password });
    alert("Register submitted (frontend only)");
  };

  return (
    <div className="reg-container">
      <div className="reg-card">
        {/* the keft side */}
        <div className="reg-left">
          <h2 className="reg-title">Register</h2>

          <form className="reg-form" onSubmit={handleSubmit}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <div className="password-row">
              <input
                type={showPass1 ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>

            <label>Re-type Password</label>
            <div className="password-row">
              <input
                type={showPass2 ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
            </div>

            <div className="terms-row">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <p>
                By registering, you agree to the Terms, Conditions and Policies
                of our Privacy Policy
              </p>
            </div>

            <button className="primary-btn" type="submit">
              Sign Up
            </button>

            <button className="secondary-btn" type="button">
              Sign up with Google
            </button>

            <p className="small-link">
              Already have an account? <span>Log In</span>
            </p>
          </form>
        </div>

        {/* the right side */}
        <div className="reg-right">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png"
            alt="Legal illustration"
          />
        </div>
      </div>
    </div>
  );
}