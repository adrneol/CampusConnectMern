import { useEffect } from "react";
import { Link } from "react-router-dom";
import { UserMinus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, removeFriend } from "../store/usersSlice";

export default function MyFriends() {
  const dispatch = useDispatch();
  const friends = useSelector((state) => state.users.items).filter((user) => user.isFriend);

  useEffect(() => {
    dispatch(fetchUsers(""));
  }, [dispatch]);

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">My friends</p>
          <h1>Your friend list</h1>
        </div>
      </div>
      <div className="user-grid">
        {friends.map((friend) => (
          <article className="user-card" key={friend.id}>
            <Link className="user-card-heading" to={`/users/${friend.id}`}>
              <span className="avatar medium">{friend.avatar ? <img src={friend.avatar} alt="" /> : friend.name.charAt(0)}</span>
              <h2>{friend.name}</h2>
            </Link>
            <p>{friend.bio || "No bio yet."}</p>
            <button className="icon-button ghost" type="button" onClick={() => dispatch(removeFriend(friend.id))}>
              <UserMinus size={18} aria-hidden="true" />
              <span>Remove friend</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
