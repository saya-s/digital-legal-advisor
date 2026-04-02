import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";

export default function Register() {
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

  const checkPasswordStrength = (value) => {
    let strength = 0;

    if (value.length >= 8) strength += 1;
    if (/[a-z]/.test(value)) strength += 1;
    if (/[A-Z]/.test(value)) strength += 1;
    if (/[0-9]/.test(value)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(value)) strength += 1;

    setPasswordStrength(strength);
  };

  const handlePasswordChange = (event) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    checkPasswordStrength(nextPassword);
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (username.trim().length < 3) {
      setErrorMessage("Choose a username with at least 3 characters.");
      return;
    }

    if (!agree) {
      setErrorMessage("Confirm the prototype disclaimer before continuing.");
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
      setIsLoading(false);
    }
  };

  const fieldClassName =
    "w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3.5 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15";
  const labelClassName = "mb-2 block text-sm font-semibold text-brand-ink";
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
            {errorMessage}
          </div>
        )}

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

        {password && (
          <div className="-mt-1">
            <div className="mb-2 flex gap-1">
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

        <label className="flex items-start gap-3 rounded-2xl mt-4 text-sm leading-7 text-slate-500">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-brand-line accent-brand-accent"
          />
          <p className="text-sm text-gray-600 leading-relaxed">
            I agree to Misharu's{" "}
            <button
              type="button"
              className="text-[#D4AF37] hover:text-[#B85C38] font-medium"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="text-[#D4AF37] hover:text-[#B85C38] font-medium"
            >
              Privacy Policy
            </button>
            .
          </p>
        </label>

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

        {/* Google signup button */}
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
          Sign up with Google
        </button>

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
