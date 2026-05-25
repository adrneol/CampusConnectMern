import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { UserCheck, UserMinus, UserPlus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import CourseCard from "../components/CourseCard";
import NoteCard from "../components/NoteCard";
import PostCard from "../components/PostCard";
import { fetchPosts } from "../store/postsSlice";
import { acceptFriendRequest, removeFriend, sendFriendRequest } from "../store/usersSlice";
import { apiRequest } from "../store/api";

export default function UserProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const courses = useSelector((state) => state.courses.items);
  const posts = useSelector((state) => state.posts.items);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    apiRequest(`/users/${id}/profile`).then(setProfile).catch(() => setProfile(null));
    dispatch(fetchPosts());
  }, [dispatch, id]);

  if (!profile) {
    return <section className="dashboard-page"><p className="muted">Loading profile...</p></section>;
  }

  const user = profile.user;
  const coursesBySlug = Object.fromEntries(courses.map((course) => [course.slug, course]));
  const profilePostIds = new Set((profile.posts || []).map((post) => post.id));
  const actionablePosts = posts.filter((post) => profilePostIds.has(post.id) || post.owner?.id === user.id);

  return (
    <section className="dashboard-page">
      <div className="profile-hero">
        <span className="avatar large">{user.avatar ? <img src={user.avatar} alt="" /> : user.name.charAt(0)}</span>
        <div>
          <p className="eyebrow">@{user.username}</p>
          <h1>{user.name}</h1>
          <p className="muted">{user.bio || "No bio yet."}</p>
          <div className="tag-row">{(user.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
        {!user.isMe && (
          user.isFriend ? (
            <button className="icon-button ghost" type="button" onClick={() => dispatch(removeFriend(user.id))}>
              <UserMinus size={18} aria-hidden="true" /><span>Unfriend</span>
            </button>
          ) : user.hasIncomingRequest ? (
            <button className="icon-button" type="button" onClick={() => dispatch(acceptFriendRequest(user.id))}>
              <UserCheck size={18} aria-hidden="true" /><span>Accept</span>
            </button>
          ) : (
            <button className="icon-button" type="button" onClick={() => dispatch(sendFriendRequest(user.id))}>
              <UserPlus size={18} aria-hidden="true" /><span>Add friend</span>
            </button>
          )
        )}
      </div>

      <div className="profile-sections">
        <section>
          <h2>Courses</h2>
          <div className="course-grid">
            {(profile.courses || []).map((course) => <CourseCard key={course.id || course.slug} course={course} />)}
          </div>
        </section>
        <section>
          <h2>Notes</h2>
          <div className="notes-list">
            {(profile.notes || []).map((note) => (
              <NoteCard key={note.id} note={note} course={coursesBySlug[note.courseSlug]} canEdit={false} onEdit={() => {}} onDelete={() => {}} />
            ))}
          </div>
        </section>
        <section>
          <h2>Posts</h2>
          <div className="post-feed compact">
            {actionablePosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </section>
      </div>
    </section>
  );
}
