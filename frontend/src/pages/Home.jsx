import { useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, ShieldCheck, UploadCloud } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { createCourse, updateCourse } from "../store/coursesSlice";
import CourseCard from "../components/CourseCard";
import { fileToDataUrl } from "../utils/files";
import { matchesCourse } from "../utils/search";

export default function Home() {
  const dispatch = useDispatch();
  const { items: courses, status } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ title: "", description: "", caption: "", level: "Community", image: "", content: "" });
  const [editingCourse, setEditingCourse] = useState(null);
  const [message, setMessage] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const visibleCourses = courses.filter((course) => matchesCourse(course, courseSearch));

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const chooseImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const image = await fileToDataUrl(file);
    setForm((current) => ({ ...current, image }));
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    const result = editingCourse
      ? await dispatch(updateCourse({ id: editingCourse.id, ...form }))
      : await dispatch(createCourse(form));
    if (!result.error) {
      setForm({ title: "", description: "", caption: "", level: "Community", image: "", content: "" });
      setEditingCourse(null);
      setMessage(editingCourse ? "Course updated." : "Course created.");
    } else {
      setMessage(result.error.message);
    }
  };

  const startCourseEdit = (course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      caption: course.caption || "",
      level: course.level || "Community",
      image: course.image,
      content: course.content || ""
    });
    document.getElementById("course-builder")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="hero" style={{ backgroundImage: "var(--hero-overlay), url('/assets/images/headerimage.jpg')" }}>
        <div className="hero-content">
          <p className="eyebrow">Collaborative course notes</p>
          <h1>Campus Connect</h1>
          <p>
            Browse course material, upload your own notes, keep drafts private, and release the best
            resources for classmates when they are ready.
          </p>
          <div className="hero-actions">
            <Link className="icon-button" to={user ? "/dashboard" : "/signup"}>
              <UploadCloud size={18} aria-hidden="true" />
              <span>{user ? "Add notes" : "Start sharing"}</span>
            </Link>
            <a className="icon-button ghost" href="#courses">
              <BookMarked size={18} aria-hidden="true" />
              <span>View courses</span>
            </a>
          </div>
        </div>
      </section>

      <section className="feature-band" aria-label="Platform features">
        <div className="feature">
          <UploadCloud size={24} aria-hidden="true" />
          <span>Add notes from your side</span>
        </div>
        <div className="feature">
          <ShieldCheck size={24} aria-hidden="true" />
          <span>Uploader-only editing</span>
        </div>
        <div className="feature">
          <BookMarked size={24} aria-hidden="true" />
          <span>Public and private releases</span>
        </div>
      </section>

      <section className="content-section" id="courses">
        <div className="section-heading">
          <p className="eyebrow">Courses</p>
          <h2>Choose a subject and collect better notes</h2>
        </div>
        <div className="search-panel">
          <label>
            <span>Search courses</span>
            <input value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder="python, PyThon, thon..." />
          </label>
        </div>
        {user && (
          <form className="course-builder" id="course-builder" onSubmit={submitCourse}>
            <div>
              <p className="eyebrow">Create course</p>
              <h3>{editingCourse ? "Edit your course" : "Upload your own course"}</h3>
            </div>
            <div className="form-grid course-form-grid">
              <label>
                <span>Name</span>
                <input name="title" value={form.title} onChange={updateField} placeholder="JavaScript Essentials" required />
              </label>
              <label>
                <span>Level</span>
                <input name="level" value={form.level} onChange={updateField} placeholder="Beginner" />
              </label>
            </div>
            <label>
              <span>Caption</span>
              <input name="caption" value={form.caption} onChange={updateField} placeholder="Quick learning path for classmates" />
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={updateField} rows="3" placeholder="What this course contains..." required />
            </label>
            <label>
              <span>Course content</span>
              <textarea name="content" value={form.content} onChange={updateField} rows="5" placeholder="Add syllabus, references, documentation links, and study plan..." />
            </label>
            <label>
              <span>Course image</span>
              <input type="file" accept="image/*" onChange={chooseImage} required={!form.image} />
            </label>
            {form.image && <img className="image-preview" src={form.image} alt="Course preview" />}
            {message && <p className="success-text">{message}</p>}
            <button className="icon-button" type="submit">
              <UploadCloud size={18} aria-hidden="true" />
              <span>{editingCourse ? "Save course" : "Create course"}</span>
            </button>
            {editingCourse && (
              <button className="icon-button ghost" type="button" onClick={() => {
                setEditingCourse(null);
                setForm({ title: "", description: "", caption: "", level: "Community", image: "", content: "" });
              }}>
                <span>Cancel edit</span>
              </button>
            )}
          </form>
        )}
        {status === "loading" ? (
          <p className="muted">Loading courses...</p>
        ) : (
          <div className="course-grid">
            {visibleCourses.map((course) => <CourseCard key={course.slug} course={course} onEdit={startCourseEdit} />)}
          </div>
        )}
      </section>
    </>
  );
}
