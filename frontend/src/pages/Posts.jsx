import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PostCard from "../components/PostCard";
import { fetchPosts } from "../store/postsSlice";
import { fetchUsers } from "../store/usersSlice";

export default function Posts({ mode = "all" }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const friends = useSelector((state) => state.users.items).filter((item) => item.isFriend);
  const friendIds = new Set(friends.map((friend) => friend.id));
  const { items: posts, status, error } = useSelector((state) => state.posts);
  const [filter, setFilter] = useState(mode === "mine" ? "mine" : "all");

  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUsers(""));
  }, [dispatch]);

  const visiblePosts = useMemo(() => {
    if (filter === "mine") return posts.filter((post) => post.owner?.id === user.id);
    if (filter === "friends") return posts.filter((post) => friendIds.has(post.owner?.id));
    return posts;
  }, [filter, friendIds, posts, user.id]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Posts</p>
          <h1>{mode === "mine" ? "My posts" : "Study posts"}</h1>
        </div>
        <div className="dashboard-filters">
          <Link className="icon-button" to="/upload-post">Upload post</Link>
          <div className="filter-box">
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter posts">
              <option value="all">All posts</option>
              <option value="friends">Friends posts</option>
              <option value="mine">My posts</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {status === "loading" && <p className="muted">Loading posts...</p>}
      <div className="post-feed">
        {visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </section>
  );
}
