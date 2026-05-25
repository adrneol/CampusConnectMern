import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import NoteForm from "../components/NoteForm";
import NoteCard from "../components/NoteCard";
import { createNote, deleteNote, fetchNotes, updateNote } from "../store/notesSlice";
import { matchesCourse } from "../utils/search";

export default function Dashboard() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { items: courses } = useSelector((state) => state.courses);
  const { items: notes, status, saving, error } = useSelector((state) => state.notes);
  const [editingNote, setEditingNote] = useState(null);
  const [filter, setFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState(searchParams.get("course") || "");
  const [courseSearch, setCourseSearch] = useState("");

  useEffect(() => {
    dispatch(fetchNotes(courseFilter));
  }, [dispatch, courseFilter]);

  const coursesBySlug = useMemo(() => {
    return Object.fromEntries(courses.map((course) => [course.slug, course]));
  }, [courses]);

  const searchedCourses = useMemo(() => courses.filter((course) => matchesCourse(course, courseSearch)), [courses, courseSearch]);

  const filteredNotes = notes.filter((note) => {
    const ownerId = note.owner?.id || note.owner?._id;
    const mine = ownerId === user.id;
    if (filter === "mine") return mine;
    if (filter === "public") return note.isPublic;
    if (filter === "private") return !note.isPublic && mine;
    return true;
  }).filter((note) => {
    if (!courseSearch) return true;
    return matchesCourse(coursesBySlug[note.courseSlug] || { title: note.courseSlug, slug: note.courseSlug }, courseSearch);
  });

  const changeCourse = (value) => {
    setCourseFilter(value);
    setEditingNote(null);
    if (value) {
      setSearchParams({ course: value });
    } else {
      setSearchParams({});
    }
  };

  const submitNote = async (payload) => {
    if (editingNote) {
      const result = await dispatch(updateNote({ id: editingNote.id, ...payload }));
      if (!result.error) {
        setEditingNote(null);
      }
      return;
    }
    await dispatch(createNote(payload));
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Notes dashboard</p>
          <h1>Save notes, edit uploads, control release</h1>
        </div>
        <div className="dashboard-filters">
          <div className="filter-box search-filter">
            <input value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder="Search courses..." aria-label="Search courses" />
          </div>
          <div className="filter-box">
            <Filter size={18} aria-hidden="true" />
            <select value={courseFilter} onChange={(event) => changeCourse(event.target.value)} aria-label="Filter by course">
              <option value="">All courses</option>
              {searchedCourses.map((course) => (
                <option key={course.slug} value={course.slug}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-box">
            <Filter size={18} aria-hidden="true" />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter notes">
              <option value="all">All visible</option>
              <option value="mine">My notes</option>
              <option value="public">Public</option>
              <option value="private">My private</option>
            </select>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <aside className="composer-panel">
          <h2>{editingNote ? "Edit note" : "Add a note"}</h2>
          <NoteForm
            courses={courses}
            editingNote={editingNote}
            defaultCourseSlug={courseFilter}
            saving={saving}
            onSubmit={submitNote}
            onCancel={() => setEditingNote(null)}
          />
          {error && <p className="error-text">{error}</p>}
        </aside>

        <div className="notes-list">
          {status === "loading" && <p className="muted">Loading notes...</p>}
          {status !== "loading" && filteredNotes.length === 0 && (
            <div className="empty-state">
              <h2>No notes here yet</h2>
              <p>Add your first course note or switch filters to see shared public notes.</p>
            </div>
          )}
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              course={coursesBySlug[note.courseSlug]}
              canEdit={(note.owner?.id || note.owner?._id) === user.id}
              onEdit={setEditingNote}
              onDelete={(id) => dispatch(deleteNote(id))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
