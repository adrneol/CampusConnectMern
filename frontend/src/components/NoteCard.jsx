import { Edit3, Lock, Trash2, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../utils/time";

export default function NoteCard({ note, course, canEdit, onEdit, onDelete }) {
  return (
    <article className="note-card">
      <div className="note-card-header">
        <div>
          <p className="eyebrow">{course?.title || note.courseSlug}</p>
          <h3>{note.title}</h3>
        </div>
        <span className={note.isPublic ? "status public" : "status private"}>
          {note.isPublic ? <Unlock size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
          {note.isPublic ? "Public" : "Private"}
        </span>
      </div>
      <p className="note-body">{note.body}</p>
      {(note.files || []).length > 0 && (
        <div className="note-files">
          {(note.files || []).map((file) => (
            <div className="note-file" key={file.id}>
              <strong>{file.name}</strong>
              {file.content && <p>{file.content}</p>}
              {(file.children || []).map((child) => (
                <div className="note-file child-file" key={child.id}>
                  <strong>{child.name}</strong>
                  {child.content && <p>{child.content}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="note-meta">
        <Link className="owner-line" to={note.owner?.id ? `/users/${note.owner.id}` : "#"}>
          <span className="avatar small">{note.owner?.avatar ? <img src={note.owner.avatar} alt="" /> : (note.owner?.name || "?").charAt(0)}</span>
          By {note.owner?.name || "Unknown uploader"} on {formatDateTime(note.createdAt)}
        </Link>
        {canEdit && (
          <div className="card-actions">
            <button className="small-icon-button" type="button" onClick={() => onEdit(note)} title="Edit note">
              <Edit3 size={16} aria-hidden="true" />
            </button>
            <button className="small-icon-button danger" type="button" onClick={() => onDelete(note.id)} title="Delete note">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
