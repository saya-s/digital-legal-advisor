import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";

// This page lets the user choose a new password.
export default function ResetPassword() {
  // These hold the new password values and page messages.
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // Read the temporary reset token from ?token=... in the URL.
  const token = searchParams.get("token") || "";

  // Check the form, save the new password, then go back to login.
  const handleSubmit = async (event) => {
    // Keep React in control instead of reloading the browser page.
    event.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("This reset link is missing or invalid.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          data.error || "We could not reset your password. Please try again.",
        );
        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          successMessage:
            "Password reset successfully. Sign in with your new password.",
        },
      });
    } catch {
      setErrorMessage(
        "We could not reach the server. Make sure the backend is running.",
      );
    } finally {
      // Always unlock the button after the request finishes.
      setIsLoading(false);
    }
  };

  // Reuse the same visual design for both password inputs.
  const fieldClassName =
    "w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15";
  const successMessage =
    // Use a blank message when the previous page sent nothing.
    typeof location.state?.successMessage === "string"
      ? location.state.successMessage
      : "";

  return (
    // Shared auth layout gives this page its outer design.
    <AuthLayout
      formTitle="Choose a new password"
      formSubtitle="Set a new password for your account to finish the reset process."
      panelTitle="Finish The Reset"
      panelDescription="Use a strong password you have not used before and then return to the sign-in page."
      panelPoints={[
        "Reset tokens expire quickly for safety.",
        "Passwords should be at least 8 characters long.",
        "Include a mix of uppercase, lowercase, numbers, and symbols.",
      ]}
    >
      {/* New-password form. */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success message box. */}
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

        {/* New password input. */}
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block text-sm font-semibold text-brand-ink"
          >
            New password
          </label>
          <div className="relative">
            {/* Switch this box between hidden and visible password text. */}
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Create a new password"
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

        {/* Confirm password input. */}
        <div>
          <label
            htmlFor="confirm-reset-password"
            className="mb-2 block text-sm font-semibold text-brand-ink"
          >
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm-reset-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
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

        {/* Save button. */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Resetting password
            </>
          ) : (
            "Save new password"
          )}
        </button>

        {/* Link back to the first reset step. */}
        <p className="text-center text-sm text-slate-500">
          Need a new reset link?{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-brand-accentDeep transition hover:text-brand-accent"
          >
            Start over
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
