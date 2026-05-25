const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    let user;

    if (usingMongo()) {
      user = await User.findById(payload.id).select("-passwordHash");
    } else {
      const data = await store.readStore();
      user = data.users.find((item) => item.id === payload.id);
    }

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = {
      id: user.id || user._id.toString(),
      name: user.name,
      username: user.username || String(user.email || "").split("@")[0],
      email: user.email,
      bio: user.bio || "",
      avatar: user.avatar || "",
      tags: user.tags || [],
      friends: user.friends || [],
      friendRequests: user.friendRequests || []
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

module.exports = { requireAuth };
