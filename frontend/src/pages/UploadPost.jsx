import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createPost } from "../store/postsSlice";
import { fileToDataUrl } from "../utils/files";

export default function UploadPost() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ caption: "", image: "", isPublic: true });

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await fileToDataUrl(file);
    setForm((current) => ({ ...current, image }));
  };

  const submitPost = async (event) => {
    event.preventDefault();
    const result = await dispatch(createPost(form));
    if (!result.error) navigate("/posts");
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Upload post</p>
          <h1>Create a picture post</h1>
        </div>
      </div>
      <form className="post-composer" onSubmit={submitPost}>
        <label>
          <span>Picture</span>
          <input type="file" accept="image/*" onChange={chooseImage} required={!form.image} />
        </label>
        {form.image && <img className="image-preview" src={form.image} alt="Post preview" />}
        <label>
          <span>Caption</span>
          <textarea value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} rows="3" />
        </label>
        <label className="toggle-line">
          <input type="checkbox" checked={form.isPublic} onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))} />
          <span>Public post</span>
        </label>
        <button className="icon-button" type="submit">
          <UploadCloud size={18} aria-hidden="true" />
          <span>Post</span>
        </button>
      </form>
    </section>
  );
}
