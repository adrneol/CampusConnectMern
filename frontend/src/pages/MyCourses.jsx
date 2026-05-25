import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CourseCard from "../components/CourseCard";
import { updateCourse } from "../store/coursesSlice";
import { fileToDataUrl } from "../utils/files";

export default function MyCourses() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const courses = useSelector((state) => state.courses.items).filter((course) => course.owner?.id === user.id);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", caption: "", level: "", image: "", content: "" });

  const startEdit = (course) => {
    setEditing(course);
    setForm({
      title: course.title,
      description: course.description,
      caption: course.caption || "",
      level: course.level || "",
      image: course.image,
      content: course.content || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (event) => {
    event.preventDefault();
    const result = await dispatch(updateCourse({ id: editing.id, ...form }));
    if (!result.error) setEditing(null);
  };

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = await fileToDataUrl(file);
    setForm((current) => ({ ...current, image }));
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">My courses</p>
          <h1>Courses created by you</h1>
        </div>
      </div>
      {editing && (
        <form className="course-builder" onSubmit={save}>
          <p className="eyebrow">Edit course</p>
          <div className="form-grid course-form-grid">
            <label><span>Name</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label>
            <label><span>Level</span><input value={form.level} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} /></label>
          </div>
          <label><span>Caption</span><input value={form.caption} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} /></label>
          <label><span>Description</span><textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows="3" required /></label>
          <label><span>Content</span><textarea value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows="5" /></label>
          <label><span>Image</span><input type="file" accept="image/*" onChange={chooseImage} /></label>
          {form.image && <img className="image-preview" src={form.image} alt="Course preview" />}
          <div className="button-row">
            <button className="icon-button" type="submit">Save course</button>
            <button className="icon-button ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
      {courses.length === 0 ? <div className="empty-state"><h2>No courses yet</h2><p>Create a course from the Courses page.</p></div> : (
        <div className="course-grid">{courses.map((course) => <CourseCard key={course.id} course={course} onEdit={startEdit} />)}</div>
      )}
    </section>
  );
}
