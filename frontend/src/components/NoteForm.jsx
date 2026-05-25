import { useEffect, useState } from "react";
import { FilePlus, FolderPlus, Save, X } from "lucide-react";

const emptyForm = {
  title: "",
  courseSlug: "python",
  body: "",
  isPublic: false,
  files: []
};

function createFile(name = "New file") {
  return {
    id: crypto.randomUUID(),
    name,
    content: "",
    children: []
  };
}

export default function NoteForm({ courses, editingNote, defaultCourseSlug, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingNote) {
      setForm({
        title: editingNote.title,
        courseSlug: editingNote.courseSlug,
        body: editingNote.body,
        isPublic: editingNote.isPublic,
        files: editingNote.files || []
      });
    } else {
      setForm((current) => ({
        ...emptyForm,
        courseSlug: defaultCourseSlug || courses[0]?.slug || "python"
      }));
    }
  }, [editingNote, courses, defaultCourseSlug]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (courses.length === 0) {
      return;
    }
    onSubmit(form);
    if (!editingNote) {
      setForm({ ...emptyForm, courseSlug: defaultCourseSlug || courses[0]?.slug || "python" });
    }
  };

  const addFile = () => {
    setForm((current) => ({ ...current, files: [...current.files, createFile()] }));
  };

  const addChildFile = (parentId) => {
    setForm((current) => ({
      ...current,
      files: current.files.map((file) =>
        file.id === parentId ? { ...file, children: [...(file.children || []), createFile("Nested file")] } : file
      )
    }));
  };

  const renameFile = (fileId, value, childId = null) => {
    setForm((current) => ({
      ...current,
      files: current.files.map((file) => {
        if (childId && file.id === fileId) {
          return {
            ...file,
            children: (file.children || []).map((child) => (child.id === childId ? { ...child, name: value } : child))
          };
        }
        return file.id === fileId ? { ...file, name: value } : file;
      })
    }));
  };

  const removeFile = (fileId, childId = null) => {
    setForm((current) => ({
      ...current,
      files: childId
        ? current.files.map((file) =>
            file.id === fileId ? { ...file, children: (file.children || []).filter((child) => child.id !== childId) } : file
          )
        : current.files.filter((file) => file.id !== fileId)
    }));
  };

  const updateFileContent = (fileId, value, childId = null) => {
    setForm((current) => ({
      ...current,
      files: current.files.map((file) => {
        if (childId && file.id === fileId) {
          return {
            ...file,
            children: (file.children || []).map((child) => (child.id === childId ? { ...child, content: value } : child))
          };
        }
        return file.id === fileId ? { ...file, content: value } : file;
      })
    }));
  };

  return (
    <form className="note-form" onSubmit={submit}>
      {courses.length === 0 && (
        <p className="caption-warning">Create or restore a course before uploading notes. Notes always live inside one chosen course.</p>
      )}
      <div className="form-grid">
        <label>
          <span>Title</span>
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            placeholder="Pointers quick revision"
            required
          />
        </label>
        <label>
          <span>Course</span>
          <select name="courseSlug" value={form.courseSlug} onChange={updateField}>
            {courses.map((course) => (
              <option key={course.slug} value={course.slug}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Notes</span>
        <textarea
          name="body"
          value={form.body}
          onChange={updateField}
          placeholder="Write or paste your study notes here..."
          rows="7"
          required
        />
      </label>
      <div className="form-footer">
        <label className="toggle-line">
          <input name="isPublic" type="checkbox" checked={form.isPublic} onChange={updateField} />
          <span>Release publicly</span>
        </label>
        <div className="button-row">
          {editingNote && (
            <button className="icon-button ghost" type="button" onClick={onCancel}>
              <X size={18} aria-hidden="true" />
              <span>Cancel</span>
            </button>
          )}
          <button className="icon-button" type="submit" disabled={saving || courses.length === 0}>
            <Save size={18} aria-hidden="true" />
            <span>{saving ? "Saving..." : "Save note"}</span>
          </button>
        </div>
      </div>
      <div className="nested-files">
        <div className="nested-files-header">
          <span>Files inside this note</span>
          <button className="small-icon-button" type="button" onClick={addFile} title="Add file">
            <FilePlus size={16} aria-hidden="true" />
          </button>
        </div>
        {form.files.map((file) => (
          <div className="nested-file" key={file.id}>
            <div className="nested-file-row">
              <input value={file.name} onChange={(event) => renameFile(file.id, event.target.value)} />
              <button className="small-icon-button" type="button" onClick={() => addChildFile(file.id)} title="Add nested file">
                <FolderPlus size={16} aria-hidden="true" />
              </button>
              <button className="small-icon-button danger" type="button" onClick={() => removeFile(file.id)} title="Delete file">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <textarea
              value={file.content || ""}
              onChange={(event) => updateFileContent(file.id, event.target.value)}
              rows="2"
              placeholder="File notes..."
            />
            {(file.children || []).map((child) => (
              <div className="nested-file child-file" key={child.id}>
                <input value={child.name} onChange={(event) => renameFile(file.id, event.target.value, child.id)} />
                <button className="small-icon-button danger" type="button" onClick={() => removeFile(file.id, child.id)} title="Delete nested file">
                  <X size={16} aria-hidden="true" />
                </button>
                <textarea
                  value={child.content || ""}
                  onChange={(event) => updateFileContent(file.id, event.target.value, child.id)}
                  rows="2"
                  placeholder="Nested file notes..."
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </form>
  );
}
