const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id || user._id.toString(),
      email: user.email
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user.id || user._id.toString(),
    name: user.name,
    username: user.username || String(user.email || "").split("@")[0],
    email: user.email,
    bio: user.bio || "",
    avatar: user.avatar || "",
    tags: user.tags || [],
    friends: (user.friends || []).map((friend) => friend.toString()),
    friendRequests: (user.friendRequests || []).map((request) => request.toString())
  };
}

module.exports = { signToken, publicUser };
