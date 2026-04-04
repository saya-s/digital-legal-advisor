import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim()) {
      setErrorMessage("Enter the email address linked to your account.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(
          data.error || "We could not start the password reset flow.",
        );
        return;
      }

      if (data.resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(data.resetToken)}`, {
          replace: true,
          state: { successMessage: data.message },
        });
        return;
      }

      setInfoMessage(
        data.message ||
          "If that email exists, you can continue to reset your password.",
      );
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

  return (
    <AuthLayout
      formTitle="Reset your password"
      formSubtitle="Enter your email address to continue with password reset."
      panelTitle="Recover Access"
      panelPoints={[
        "Use the same email address you registered with.",
        "Create a new strong password before signing back in.",
        "Reset tokens expire after a short time for safety.",
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div className="rounded-2xl border border-brand-success/20 bg-brand-success/10 px-4 py-3 text-sm text-brand-success">
            {infoMessage}
          </div>
        )}

        <div>
          <label
            htmlFor="reset-email"
            className="mb-2 block text-sm font-semibold text-brand-ink"
          >
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Enter your email address"
            className={fieldClassName}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-ink px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Preparing reset
            </>
          ) : (
            "Continue to reset"
          )}
        </button>

        <p className="text-center text-sm text-slate-500">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-accentDeep transition hover:text-brand-accent"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
