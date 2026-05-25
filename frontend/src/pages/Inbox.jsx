import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchUsers } from "../store/usersSlice";
import { apiRequest, SOCKET_URL } from "../store/api";
import { formatDateTime } from "../utils/time";

export default function Inbox() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: users } = useSelector((state) => state.users);
  const friends = useMemo(() => users.filter((item) => item.isFriend), [users]);
  const [activeFriendId, setActiveFriendId] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadSummary, setUnreadSummary] = useState({ totalUnread: 0, unreadBySender: {} });
  const [text, setText] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    dispatch(fetchUsers(""));
    apiRequest("/messages").then(setUnreadSummary).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!activeFriendId && friends.length > 0) {
      setActiveFriendId(friends[0].id);
    }
  }, [friends, activeFriendId]);

  useEffect(() => {
    const token = localStorage.getItem("campusConnectToken");
    if (!token) {
      return undefined;
    }

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on("message:new", (message) => {
      setMessages((current) => {
        const belongsToOpenChat =
          activeFriendId &&
          ((message.sender === activeFriendId && message.receiver === user.id) ||
            (message.sender === user.id && message.receiver === activeFriendId));
        if (!belongsToOpenChat || current.some((item) => item.id === message.id)) {
          apiRequest("/messages").then(setUnreadSummary).catch(() => {});
          return current;
        }
        apiRequest(`/messages/${activeFriendId}`)
          .then(() => apiRequest("/messages"))
          .then(setUnreadSummary)
          .catch(() => {});
        return [...current, message];
      });
    });

    return () => socket.disconnect();
  }, [activeFriendId, user.id]);

  useEffect(() => {
    if (!activeFriendId) {
      setMessages([]);
      return;
    }

    apiRequest(`/messages/${activeFriendId}`)
      .then((items) => {
        setMessages(items);
        return apiRequest("/messages");
      })
      .then(setUnreadSummary)
      .catch(() => setMessages([]));
  }, [activeFriendId]);

  const activeFriend = friends.find((friend) => friend.id === activeFriendId);

  const sendMessage = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeFriendId || !socketRef.current) {
      return;
    }
    socketRef.current.emit("message:send", { receiver: activeFriendId, text: trimmed }, (response) => {
      if (response?.ok) {
        setText("");
      }
    });
  };

  const clearChat = async () => {
    if (!activeFriendId) {
      return;
    }
    await apiRequest(`/messages/${activeFriendId}`, { method: "DELETE" });
    setMessages([]);
    apiRequest("/messages").then(setUnreadSummary).catch(() => {});
  };

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Talk with your friends</h1>
          <p className="muted">{unreadSummary.totalUnread || 0} unread messages</p>
        </div>
      </div>
      <div className="inbox-layout">
        <aside className="friend-list">
          {friends.length === 0 && <p className="muted">Add friends first to start chatting.</p>}
          {friends.map((friend) => (
            <button
              className={friend.id === activeFriendId ? "friend-row active" : "friend-row"}
              key={friend.id}
              type="button"
              onClick={() => setActiveFriendId(friend.id)}
            >
              <span className="friend-name">
                <span className="avatar small">{friend.avatar ? <img src={friend.avatar} alt="" /> : friend.name.charAt(0)}</span>
                {friend.name}
                {(unreadSummary.unreadBySender?.[friend.id] || 0) > 0 && <b>{unreadSummary.unreadBySender[friend.id]}</b>}
              </span>
              <small>{(friend.tags || []).slice(0, 2).join(" ")}</small>
            </button>
          ))}
        </aside>
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-title">
              {activeFriend && <Link className="avatar medium" to={`/users/${activeFriend.id}`}>{activeFriend.avatar ? <img src={activeFriend.avatar} alt="" /> : activeFriend.name.charAt(0)}</Link>}
              <h2>{activeFriend ? activeFriend.name : "Select a friend"}</h2>
            </div>
            {activeFriend && (
              <button className="small-icon-button danger" type="button" onClick={clearChat} title="Clear chat">
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="message-list">
            {messages.map((message) => (
              <div className={message.sender === user.id ? "message mine" : "message"} key={message.id}>
                <Link className="message-avatar avatar small" to={`/users/${message.sender}`}>
                  {message.sender === user.id
                    ? user.avatar
                      ? <img src={user.avatar} alt="" />
                      : user.name.charAt(0)
                    : activeFriend?.avatar
                      ? <img src={activeFriend.avatar} alt="" />
                      : activeFriend?.name.charAt(0)}
                </Link>
                <p>{message.text}</p>
                <time>{formatDateTime(message.createdAt)}</time>
              </div>
            ))}
          </div>
          <form className="message-composer" onSubmit={sendMessage}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={activeFriend ? "Write a message..." : "Choose a friend first"}
              disabled={!activeFriend}
            />
            <button className="small-icon-button" type="submit" title="Send message" disabled={!activeFriend}>
              <Send size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
