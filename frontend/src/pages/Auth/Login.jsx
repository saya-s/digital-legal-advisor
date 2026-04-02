import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import { setAuthSession } from "../../utils/authSession.js";

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
          <p className="text-xs leading-6 text-slate-400">
            Password reset is not connected yet in this prototype.
          </p>
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

        <button
          type="button"
          className="w-full py-3 bg-white border border-gray-200 rounded-xl font-semibold text-[#1A2035] hover:bg-gray-50 transition flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

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
