import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { deleteAccount, logout, updateProfile } from "../store/authSlice";
import { clearNotes } from "../store/notesSlice";
import { fileToDataUrl } from "../utils/files";

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
    tags: (user?.tags || []).join(" ")
  });

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const chooseAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const avatar = await fileToDataUrl(file);
    setForm((current) => ({ ...current, avatar }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const result = await dispatch(updateProfile(form));
    if (!result.error) {
      setMessage("Profile updated.");
    }
  };

  const removeAccount = async () => {
    if (!deletePassword) {
      setMessage("Enter your password before deleting your account.");
      return;
    }
    const result = await dispatch(deleteAccount({ password: deletePassword }));
    if (!result.error) {
      dispatch(clearNotes());
      dispatch(logout());
    } else {
      setMessage(result.error.message);
    }
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>Edit your profile and account</h1>
        </div>
      </div>
      <div className="profile-grid">
        <form className="auth-panel profile-panel" onSubmit={saveProfile}>
          <div className="profile-avatar-row">
            <span className="avatar large">{form.avatar ? <img src={form.avatar} alt="" /> : form.name.charAt(0)}</span>
            <label>
              <span>Profile picture</span>
              <input type="file" accept="image/*" onChange={chooseAvatar} />
            </label>
          </div>
          <label>
            <span>Name</span>
            <input name="name" value={form.name} onChange={updateField} required />
          </label>
          <label>
            <span>Bio</span>
            <textarea name="bio" value={form.bio} onChange={updateField} rows="5" placeholder="What are you learning?" />
          </label>
          <label>
            <span>Topic tags</span>
            <input name="tags" value={form.tags} onChange={updateField} placeholder="#python #c #webdev" />
          </label>
          <p className="muted">Use tags like #python, #c, #java, #xyz so other users can filter and find you.</p>
          {message && <p className="success-text">{message}</p>}
          <button className="icon-button full-width" type="submit">
            <Save size={18} aria-hidden="true" />
            <span>Save profile</span>
          </button>
        </form>

        <div className="auth-panel profile-panel danger-panel">
          <p className="eyebrow">Danger zone</p>
          <h2>Delete my account</h2>
          <p className="muted">This removes your account and notes. Enter your password to confirm.</p>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              placeholder="Current password"
            />
          </label>
          <button className="icon-button danger-button full-width" type="button" onClick={removeAccount}>
            <Trash2 size={18} aria-hidden="true" />
            <span>Delete account</span>
          </button>
        </div>
      </div>
    </section>
  );
}
