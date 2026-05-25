import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../store/authSlice";

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ email: "", oneTimeCode: "", password: "" });

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(forgotPassword(form));
    if (!result.error) {
      setMessage("Password changed. You can login with the new password now.");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <p className="eyebrow">Password recovery</p>
        <h1>Reset with your one-time code</h1>
        <label>
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          <span>One-time reset code</span>
          <input name="oneTimeCode" value={form.oneTimeCode} onChange={updateField} minLength="6" required />
        </label>
        <label>
          <span>New password</span>
          <input name="password" type="password" value={form.password} onChange={updateField} minLength="6" required />
        </label>
        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}
        <button className="icon-button full-width" type="submit" disabled={status === "loading"}>
          <KeyRound size={18} aria-hidden="true" />
          <span>{status === "loading" ? "Updating..." : "Change password"}</span>
        </button>
        <p className="muted">
          Remembered it? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
