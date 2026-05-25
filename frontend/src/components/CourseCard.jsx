import { useState } from "react";
import { ArrowRight, BookMarked, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteCourse } from "../store/coursesSlice";
import { formatDateTime } from "../utils/time";

export default function CourseCard({ course, onEdit }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [preview, setPreview] = useState(false);
  const mine = user && !course.isDefault && course.owner?.id === user.id;

  return (
    <article className="course-card">
      <button className="image-button" type="button" onClick={() => setPreview(true)}>
        <img src={course.image} alt={`${course.title} course`} />
      </button>
      <div>
        <span>{course.level}</span>
        <h3>{course.title}</h3>
        <p className="course-caption">{course.isDefault ? "Default course" : course.caption}</p>
        <p>{course.description}</p>
        {course.content && <p className="course-content">{course.content}</p>}
        <p className="course-byline owner-line">
          {!course.isDefault && (
            <span className="avatar small">
              {course.owner?.avatar ? <img src={course.owner.avatar} alt="" /> : (course.owner?.name || "?").charAt(0)}
            </span>
          )}
          <span>
            {course.isDefault ? "Default course" : `Created by ${course.owner?.name || "Unknown user"}`}
            {course.createdAt ? ` on ${formatDateTime(course.createdAt)}` : ""}
          </span>
        </p>
        <Link to={user ? `/dashboard?course=${course.slug}` : "/login"}>
          Open notes <ArrowRight size={16} aria-hidden="true" />
        </Link>
        {mine && (
          <div className="course-actions">
            {onEdit && (
              <button className="small-icon-button" type="button" onClick={() => onEdit(course)} title="Edit course">
                <BookMarked size={16} aria-hidden="true" />
              </button>
            )}
            <button className="small-icon-button danger" type="button" onClick={() => dispatch(deleteCourse(course.id))} title="Delete course">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {preview && (
        <button className="image-lightbox" type="button" onClick={() => setPreview(false)}>
          <img src={course.image} alt={`${course.title} full preview`} />
        </button>
      )}
    </article>
  );
}
