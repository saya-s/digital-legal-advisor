import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { setAuthSession } from "../../utils/authSession.js";
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const successMessage =
    typeof location.state?.successMessage === "string"
      ? location.state.successMessage
      : "";
  const redirectTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/dashboard";

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!identifier.trim() || !password) {
      setErrorMessage("Enter your email or username and your password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          data.error || "We could not sign you in. Please try again.",
        );
        return;
      }

      setAuthSession({
        username: data.username,
        userId: data.userId,
        token: data.token,
        rememberMe,
      });

      navigate(redirectTo, { replace: true });
    } catch {
      setErrorMessage(
        "We could not reach the server. Make sure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClassName =
    "w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15";
  const labelClassName = "mb-2 block text-sm font-semibold text-brand-ink";
  const registerState =
    typeof location.state?.from === "string"
      ? { from: location.state.from }
      : undefined;

  return (
    <AuthLayout
      formTitle="Sign in to your workspace"
      formSubtitle="Access your saved analyses, continue reviewing contracts, and return to unfinished legal questions."
      panelTitle="Welcome Back"
      panelDescription=" Continue your journey to clearer, safer legal understanding.
                Your contracts deserve wisdom, both ancient and new."
      panelPoints={[
        "Review saved contract analyses without uploading the same file again.",
        "Pick up where you left off in the legal Q&A assistant.",
        "Keep your small-business contract workflow in one place.",
      ]}
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {successMessage && (
          <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 px-4 py-3 text-sm text-brand-success">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="identifier" className={labelClassName}>
            Email or username
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            placeholder="Enter your email or username"
            className={fieldClassName}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
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

        <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-brand-line accent-brand-accent"
            />
            Keep me signed in on this device
          </label>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold leading-6 text-brand-accentDeep transition hover:text-brand-accent"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </button>
{/*login in with google */}
 <GoogleLogin
  onSuccess={async (credentialResponse) => {
    try {
      const response = await fetch(buildApiUrl("/api/google-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json().catch(() => ({}));

    if (response.ok) {
      setAuthSession({
        username: data.username,
        userId: data.userId,
        token: data.token, // Save the new token
        rememberMe,
      });
      navigate(redirectTo, { replace: true });
    }  else {
        setErrorMessage(data.error || "Login failed.");
      }
    } catch (err) {
      setErrorMessage("Connection error. Is the backend running?");
    }
  }}
  onError={() => setErrorMessage("Google Login Failed")}
/>

        <p className="text-center text-sm text-slate-500">
          New to Misharu?{" "}
          <Link
            to="/register"
            state={registerState}
            className="font-semibold text-brand-accentDeep transition hover:text-brand-accent"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
