import { useState } from "react";
import { Heart, MessageCircle, Save, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { commentPost, deletePost, favoritePost, likePost, updatePost } from "../store/postsSlice";
import { formatDateTime } from "../utils/time";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [comments, setComments] = useState("");
  const [editing, setEditing] = useState(null);
  const [openComments, setOpenComments] = useState(false);
  const mine = post.owner?.id === user.id;

  const submitComment = async (event) => {
    event.preventDefault();
    const text = comments.trim();
    if (!text) return;
    await dispatch(commentPost({ id: post.id, text }));
    setComments("");
  };

  return (
    <article className="post-card">
      <Link className="post-owner" to={`/users/${post.owner?.id}`}>
        <span className="avatar medium">{post.owner?.avatar ? <img src={post.owner.avatar} alt="" /> : post.owner?.name?.charAt(0)}</span>
        <span>
          <strong>{post.owner?.name}</strong>
          <small>@{post.owner?.username} - {formatDateTime(post.createdAt)}</small>
        </span>
      </Link>
      <img className="post-image" src={post.image} alt="User post" />
      {editing !== null ? (
        <textarea value={editing} onChange={(event) => setEditing(event.target.value)} rows="3" />
      ) : (
        <p>{post.caption}</p>
      )}
      <div className="post-actions">
        <button className={post.likedByMe ? "small-icon-button active" : "small-icon-button"} type="button" onClick={() => dispatch(likePost(post.id))} title="Like">
          <Heart size={16} aria-hidden="true" />
        </button>
        <span>{post.likesCount}</span>
        <button className={post.favoritedByMe ? "small-icon-button active" : "small-icon-button"} type="button" onClick={() => dispatch(favoritePost(post.id))} title="Favorite">
          <Star size={16} aria-hidden="true" />
        </button>
        <span>{post.favoritesCount}</span>
        {mine && (
          <>
            <button className="small-icon-button" type="button" onClick={() => dispatch(updatePost({ id: post.id, caption: post.caption, isPublic: !post.isPublic }))} title="Toggle public">
              <Save size={16} aria-hidden="true" />
            </button>
            <button className="small-icon-button" type="button" onClick={() => {
              if (editing !== null) {
                dispatch(updatePost({ id: post.id, caption: editing, isPublic: post.isPublic }));
                setEditing(null);
              } else {
                setEditing(post.caption);
              }
            }} title="Edit caption">
              <MessageCircle size={16} aria-hidden="true" />
            </button>
            <button className="small-icon-button danger" type="button" onClick={() => dispatch(deletePost(post.id))} title="Delete post">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      <details className="likes-drawer">
        <summary>{post.likesCount} liked this</summary>
        {(post.likedUsers || []).length === 0 ? <p className="muted">No likes yet.</p> : (
          <div className="mini-user-list">
            {post.likedUsers.map((likedUser) => (
              <Link key={likedUser.id} to={`/users/${likedUser.id}`}>
                <span className="avatar small">{likedUser.avatar ? <img src={likedUser.avatar} alt="" /> : likedUser.name.charAt(0)}</span>
                <span>{likedUser.name}</span>
              </Link>
            ))}
          </div>
        )}
      </details>
      <span className={post.isPublic ? "status public" : "status private"}>{post.isPublic ? "Public" : "Private"}</span>
      <button className="comment-toggle" type="button" onClick={() => setOpenComments((current) => !current)}>
        Comments ({(post.comments || []).length})
      </button>
      {openComments && (
        <div className="comments">
          {(post.comments || []).map((comment) => (
            <p key={comment.id}>
              <Link to={`/users/${comment.owner?.id}`}>{comment.owner?.name}</Link>: {comment.text}
            </p>
          ))}
          <form className="comment-form" onSubmit={submitComment}>
            <input value={comments} onChange={(event) => setComments(event.target.value)} placeholder="Add comment..." />
            <button className="small-icon-button" type="submit" title="Comment">
              <MessageCircle size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
