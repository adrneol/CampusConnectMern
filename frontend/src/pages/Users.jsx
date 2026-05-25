import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserMinus, UserPlus, UserCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { acceptFriendRequest, fetchUsers, removeFriend, sendFriendRequest } from "../store/usersSlice";

export default function Users() {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { items, status, error } = useSelector((state) => state.users);
  const [tag, setTag] = useState("");

  useEffect(() => {
    dispatch(fetchUsers(""));
  }, [dispatch]);

  const search = (event) => {
    event.preventDefault();
    dispatch(fetchUsers(tag));
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">All users</p>
          <h1>Find learners by topic tags</h1>
        </div>
        <form className="filter-box user-search" onSubmit={search}>
          <Search size={18} aria-hidden="true" />
          <input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="#python" />
          <button className="small-icon-button" type="submit" title="Search users">
            <Search size={16} aria-hidden="true" />
          </button>
        </form>
      </div>

      {error && <p className="error-text">{error}</p>}
      {status === "loading" && <p className="muted">Loading users...</p>}
      <div className="user-grid">
        {items
          .filter((item) => item.id !== currentUser.id)
          .map((user) => {
            const incoming = (currentUser.friendRequests || []).includes(user.id);
            return (
              <article className="user-card" key={user.id}>
                <Link className="user-card-heading" to={`/users/${user.id}`}>
                  <span className="avatar medium">{user.avatar ? <img src={user.avatar} alt="" /> : user.name.charAt(0)}</span>
                  <h2>{user.name}</h2>
                </Link>
                <p>{user.bio || "No bio yet."}</p>
                <div className="tag-row">
                  {(user.tags || []).map((tagItem) => (
                    <span key={tagItem}>{tagItem}</span>
                  ))}
                </div>
                {user.isFriend ? (
                  <button className="icon-button ghost" type="button" onClick={() => dispatch(removeFriend(user.id))}>
                    <UserMinus size={18} aria-hidden="true" />
                    <span>Remove friend</span>
                  </button>
                ) : user.hasIncomingRequest || incoming ? (
                  <button className="icon-button" type="button" onClick={() => dispatch(acceptFriendRequest(user.id))}>
                    <UserCheck size={18} aria-hidden="true" />
                    <span>Accept request</span>
                  </button>
                ) : user.hasSentRequest ? (
                  <button className="icon-button ghost" type="button" disabled>
                    <UserCheck size={18} aria-hidden="true" />
                    <span>Request sent</span>
                  </button>
                ) : (
                  <button className="icon-button" type="button" onClick={() => dispatch(sendFriendRequest(user.id))}>
                    <UserPlus size={18} aria-hidden="true" />
                    <span>Add friend</span>
                  </button>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
}
