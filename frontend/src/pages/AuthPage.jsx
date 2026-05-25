import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, login, signup } from "../store/authSlice";

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", oneTimeCode: "" });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, mode]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const action = isSignup ? signup(form) : login({ email: form.email, password: form.password });
    const result = await dispatch(action);
    if (!result.error) {
      navigate("/dashboard");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <p className="eyebrow">{isSignup ? "Create account" : "Welcome back"}</p>
        <h1>{isSignup ? "Sign up to upload notes" : "Login to your notes space"}</h1>
        {isSignup && (
          <>
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={updateField} placeholder="Your name" required />
            </label>
            <label>
              <span>One-time reset code</span>
              <input
                name="oneTimeCode"
                value={form.oneTimeCode}
                onChange={updateField}
                placeholder="At least 6 characters"
                minLength="6"
                required
              />
            </label>
            <p className="caption-warning">
              Remember this code or take a screenshot. It is required if you forget your password.
            </p>
          </>
        )}
        <label>
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
        </label>
        <label>
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="Minimum 6 characters"
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="icon-button full-width" type="submit" disabled={status === "loading"}>
          {isSignup ? <UserPlus size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
          <span>{status === "loading" ? "Please wait..." : isSignup ? "Create account" : "Login"}</span>
        </button>
        <p className="muted">
          {isSignup ? "Already have an account?" : "New to Campus Connect?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Login" : "Sign up"}</Link>
        </p>
        {!isSignup && (
          <p className="muted">
            Forgot password? <Link to="/forgot-password">Reset with one-time code</Link>
          </p>
        )}
      </form>
    </section>
  );
}
