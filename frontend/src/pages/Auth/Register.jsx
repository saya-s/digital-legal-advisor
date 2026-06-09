import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { GoogleLogin } from '@react-oauth/google';
import { setAuthSession } from "../../utils/authSession.js";
import {
  buildGoogleOriginMismatchHelpMessage,
} from "../../utils/googleAuth.js";

// This page creates a new account with a password or Google.
export default function Register() {
  // Form values, password checks, and messages shown to the user.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // Count how many basic password-strength rules are met.
  const checkPasswordStrength = (value) => {
    // Each matching rule adds one point to the final score.
    let strength = 0;

    if (value.length >= 8) strength += 1;
    if (/[a-z]/.test(value)) strength += 1;
    if (/[A-Z]/.test(value)) strength += 1;
    if (/[0-9]/.test(value)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(value)) strength += 1;

    setPasswordStrength(strength);
  };

  // Save the password and refresh its strength score.
  const handlePasswordChange = (event) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    checkPasswordStrength(nextPassword);
  };

  // Turn the strength score into text shown below the password.
  const getStrengthText = () => {
    const strengths = [
      "Too weak",
      "Very weak",
      "Weak",
      "Fair",
      "Good",
      "Strong",
    ];
    return strengths[passwordStrength] || "Too weak";
  };

  // Validate the form, create the account, then send the user to login.
  const handleSubmit = async (event) => {
    // Prevent the browser's normal page refresh.
    event.preventDefault();
    setErrorMessage("");

    if (username.trim().length < 3) {
      setErrorMessage("Choose a username with at least 3 characters.");
      return;
    }

    if (!agree) {
      setErrorMessage("Please accept the Terms of Service to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (passwordStrength < 3) {
      setErrorMessage(
        "Choose a stronger password before creating the account.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      // Keep handling errors even if the backend sends no JSON body.
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          data.error || "We could not create the account. Please try again.",
        );
        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          successMessage:
            "Account created successfully. Sign in to open your workspace.",
          from:
            typeof location.state?.from === "string"
              ? location.state.from
              : undefined,
        },
      });
    } catch {
      setErrorMessage(
        "We could not reach the server. Make sure the backend is running.",
      );
    } finally {
      // Always make the submit button usable again.
      setIsLoading(false);
    }
  };

  // Create or sign in an account using the Google response.
  const handleGoogleSignup = async (credentialResponse) => {
    setErrorMessage("");

    if (!agree) {
      setErrorMessage("Please accept the Terms of Service to continue.");
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/google-auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setAuthSession({
          username: data.username,
          userId: data.userId,
          token: data.token,
          rememberMe: true,
        });
        navigate("/dashboard");
        return;
      }

      setErrorMessage(data.error || "Google sign-up failed.");
    } catch {
      setErrorMessage("Could not connect to the authentication server.");
    }
  };

  const fieldClassName =
    "w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15";
  const labelClassName = "mb-2 block text-sm font-semibold text-brand-ink";
  // Pick the password meter colors from the current strength score.
  const strengthFillClass = [
    "bg-brand-line",
    "bg-brand-danger",
    "bg-brand-warning",
    "bg-brand-warning",
    "bg-brand-accent",
    "bg-brand-success",
  ];
  const strengthToneClass = [
    "text-slate-400",
    "text-brand-danger",
    "text-brand-warning",
    "text-brand-warning",
    "text-brand-accentDeep",
    "text-brand-success",
  ];

  return (
    <AuthLayout
      formTitle="Create your account"
      formSubtitle="Set up your workspace to save analyses, compare contracts, and continue your review across sessions."
      panelTitle="Join Our Community"
      panelDescription="Create an account to test the workspace flow and store user-specific activity."
      panelPoints={[
        "Save previous document analyses and return to them later.",
        "Keep contract questions and document review in one workspace.",
        "Access to verified templates",
        "Risk detection & alerts",
      ]}
    >
      {/* Main account-creation form. */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            {errorMessage}
          </div>
        )}

        {/* Basic account details. */}
        <div>
          <label htmlFor="username" className={labelClassName}>
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Choose a username"
            className={fieldClassName}
            required
          />
        </div>

        {/* Email, password, and live strength meter. */}
        <div>
          <label htmlFor="email" className={labelClassName}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Enter your email address"
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="new-password" className={labelClassName}>
            Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              autoComplete="new-password"
              placeholder="Create a password"
              className={`${fieldClassName} pr-12`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-brand-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Show the strength meter only after the user starts typing. */}
        {password && (
          <div className="-mt-1">
            <div className="mb-2 flex gap-1">
              {/* Create the five small bars in the strength meter. */}
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 flex-1 rounded-full ${
                    level <= passwordStrength
                      ? strengthFillClass[passwordStrength]
                      : strengthFillClass[0]
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-xs font-semibold ${
                strengthToneClass[passwordStrength]
              }`}
            >
              Password strength: {getStrengthText()}
            </p>
          </div>
        )}

        {/* Re-entering the password catches typing mistakes. */}
        <div>
          <label htmlFor="confirm-password" className={labelClassName}>
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className={`${fieldClassName} pr-12`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-brand-ink"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* The user must accept the legal pages before continuing. */}
        <label className="flex items-start gap-3 rounded-2xl mt-4 text-sm leading-7 text-slate-500">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-brand-line accent-brand-accent"
          />
          <p className="text-sm text-gray-600 leading-relaxed">
            I agree to Misharu's{" "}
            <Link
              to="/terms"
              className="font-medium text-brand-accentDeep transition hover:text-brand-accent"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="font-medium text-brand-accentDeep transition hover:text-brand-accent"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </label>

        {/* Password-based account creation. */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account
            </>
          ) : (
            "Create account"
          )}
        </button>

        {/* Google signup follows the same disclaimer consent gate as password signup. */}
        {/* Google signup follows the same consent check. */}
        <GoogleLogin
          onSuccess={handleGoogleSignup}
          onError={() =>
            setErrorMessage(buildGoogleOriginMismatchHelpMessage())
          }
          useOneTap={agree}
        />
        {/* Show this reminder only while the consent box is unchecked. */}
        {!agree && (
          <p className="text-center text-xs leading-6 text-slate-500">
            Check the disclaimer checkbox above to continue with Google sign-up.
          </p>
        )}

        {/* Link for users who already have an account. */}
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            state={
              typeof location.state?.from === "string"
                ? { from: location.state.from }
                : undefined
            }
            className="font-semibold text-brand-accentDeep transition hover:text-brand-accent"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
