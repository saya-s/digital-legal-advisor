import { useState } from "react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(email, password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/*the left side */}
        <div className="login">
          <h2>Welcome again!</h2>
          <p className="subtitle">Please enter your details</p>

          <form onSubmit={handleSubmit}>
            <label>Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="login-options">
              <div>
                <input type="checkbox" />
                <span> Remember me</span>
              </div>
              <span className="forgot">Forgot Password?</span>
            </div>

            <button type="submit" className="primary-btn">
              Log In
            </button>

            <button type="button" className="secondary-btn">
              Log in with Google
            </button>
          </form>
        </div>

        {/* the right side*/}
        <div className="img">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Illustration"
          />
        </div>

      </div>
    </div>
  );
}