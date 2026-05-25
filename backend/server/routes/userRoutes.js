const express = require("express");
const bcrypt = require("bcryptjs");
const Message = require("../models/Message");
const Note = require("../models/Note");
const Course = require("../models/Course");
const Post = require("../models/Post");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { publicUser } = require("../utils/auth");
const { normalizeTags } = require("../utils/tags");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");

const router = express.Router();

function directoryUser(user, viewerId) {
  const friendIds = (user.friends || []).map((id) => id.toString());
  const requestIds = (user.friendRequests || []).map((id) => id.toString());
  const viewerRequestIds = (user.viewerFriendRequests || []).map((id) => id.toString());

  return {
    ...publicUser(user),
    isFriend: friendIds.includes(viewerId),
    hasSentRequest: requestIds.includes(viewerId),
    hasIncomingRequest: viewerRequestIds.includes(user._id.toString())
  };
}

function publicProfileUser(user, viewerId) {
  const friendIds = (user.friends || []).map((id) => id.toString());
  const requestIds = (user.friendRequests || []).map((id) => id.toString());
  return {
    ...publicUser(user),
    isMe: (user.id || user._id.toString()) === viewerId,
    isFriend: friendIds.includes(viewerId),
    hasSentRequest: requestIds.includes(viewerId)
  };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tag = String(req.query.tag || "").trim().toLowerCase();
    const normalizedTag = tag ? (tag.startsWith("#") ? tag : `#${tag}`) : "";
    const query = normalizedTag ? { tags: normalizedTag } : {};

    if (!usingMongo()) {
      const data = await store.readStore();
      const viewer = data.users.find((user) => user.id === req.user.id);
      const users = data.users
        .filter((user) => !normalizedTag || (user.tags || []).includes(normalizedTag))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 100)
        .map((user) => {
          const friendIds = user.friends || [];
          const requestIds = user.friendRequests || [];
          const viewerRequestIds = viewer?.friendRequests || [];
          return {
            ...publicUser(user),
            isFriend: friendIds.includes(req.user.id),
            hasSentRequest: requestIds.includes(req.user.id),
            hasIncomingRequest: viewerRequestIds.includes(user.id)
          };
        });
      return res.json(users);
    }

    const viewer = await User.findById(req.user.id).select("friendRequests");
    const users = await User.find(query).sort({ name: 1 }).limit(100);

    res.json(users.map((user) => directoryUser({ ...user.toObject(), viewerFriendRequests: viewer?.friendRequests || [] }, req.user.id)));
  } catch (error) {
    next(error);
  }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, bio, tags, avatar } = req.body;
    const update = {
      name: String(name || "").trim(),
      bio: String(bio || "").trim(),
      avatar: String(avatar || ""),
      tags: normalizeTags(tags)
    };

    if (!update.name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (!usingMongo()) {
      const data = await store.readStore();
      const user = data.users.find((item) => item.id === req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      Object.assign(user, update);
      await store.writeStore(data);
      return res.json({ user: publicUser(user) });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/profile", requireAuth, async (req, res, next) => {
  try {
    if (!usingMongo()) {
      const data = await store.readStore();
      const user = data.users.find((item) => item.id === req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const isMe = req.params.id === req.user.id;
      const profile = publicProfileUser(user, req.user.id);
      const courses = data.courses
        .filter((course) => course.ownerId === req.params.id || (course.isDefault && isMe))
        .map((course) => ({ ...course, owner: publicUser(user) }));
      const notes = data.notes
        .filter((note) => note.ownerId === req.params.id && (note.isPublic || isMe))
        .map((note) => ({ ...note, owner: publicUser(user) }));
      const posts = (data.posts || [])
        .filter((post) => post.ownerId === req.params.id && (post.isPublic || isMe))
        .map((post) => ({ ...post, owner: publicUser(user), likesCount: (post.likes || []).length, favoritesCount: (post.favorites || []).length }));
      return res.json({ user: profile, courses, notes, posts });
    }

    const profileUser = await User.findById(req.params.id).select("-passwordHash");
    if (!profileUser) return res.status(404).json({ message: "User not found" });
    const isMe = req.params.id === req.user.id;
    const courses = await Course.find({ owner: req.params.id }).populate("owner", "name username email avatar").sort({ updatedAt: -1 });
    const notes = await Note.find({ owner: req.params.id, ...(isMe ? {} : { isPublic: true }) }).populate("owner", "name username email avatar").sort({ updatedAt: -1 });
    const posts = await Post.find({ owner: req.params.id, ...(isMe ? {} : { isPublic: true }) }).populate("owner", "name username email avatar").sort({ updatedAt: -1 });
    res.json({
      user: publicProfileUser(profileUser, req.user.id),
      courses,
      notes: notes.map((note) => ({
        id: note._id.toString(),
        title: note.title,
        body: note.body,
        courseSlug: note.courseSlug,
        isPublic: note.isPublic,
        files: note.files || [],
        owner: publicUser(note.owner),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      })),
      posts: posts.map((post) => ({
        id: post._id.toString(),
        caption: post.caption,
        image: post.image,
        isPublic: post.isPublic,
        owner: publicUser(post.owner),
        likesCount: (post.likes || []).length,
        favoritesCount: (post.favorites || []).length,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required to delete your account" });
    }

    if (!usingMongo()) {
      const data = await store.readStore();
      const currentUser = data.users.find((item) => item.id === req.user.id);
      if (!currentUser || !(await bcrypt.compare(password, currentUser.passwordHash))) {
        return res.status(401).json({ message: "Password is incorrect" });
      }
      data.notes = data.notes.filter((note) => note.ownerId !== req.user.id);
      data.messages = (data.messages || []).filter((message) => message.sender !== req.user.id && message.receiver !== req.user.id);
      data.posts = (data.posts || []).filter((post) => post.ownerId !== req.user.id);
      data.users = data.users
        .filter((user) => user.id !== req.user.id)
        .map((user) => ({
          ...user,
          friends: (user.friends || []).filter((id) => id !== req.user.id),
          friendRequests: (user.friendRequests || []).filter((id) => id !== req.user.id)
        }));
      await store.writeStore(data);
      return res.status(204).end();
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser || !(await bcrypt.compare(password, currentUser.passwordHash))) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    await Note.deleteMany({ owner: req.user.id });
    await Message.deleteMany({ $or: [{ sender: req.user.id }, { receiver: req.user.id }] });
    await User.updateMany(
      {},
      {
        $pull: {
          friends: req.user.id,
          friendRequests: req.user.id
        }
      }
    );
    await User.findByIdAndDelete(req.user.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/friend-request", requireAuth, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }

    if (!usingMongo()) {
      const data = await store.readStore();
      const target = data.users.find((user) => user.id === req.params.id);
      if (!target) {
        return res.status(404).json({ message: "User not found" });
      }
      if ((target.friends || []).includes(req.user.id)) {
        return res.status(409).json({ message: "You are already friends" });
      }
      target.friendRequests = Array.from(new Set([...(target.friendRequests || []), req.user.id]));
      await store.writeStore(data);
      return res.json({ message: "Friend request sent" });
    }

    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyFriend = (target.friends || []).some((id) => id.toString() === req.user.id);
    if (alreadyFriend) {
      return res.status(409).json({ message: "You are already friends" });
    }

    await User.updateOne({ _id: req.params.id }, { $addToSet: { friendRequests: req.user.id } });
    res.json({ message: "Friend request sent" });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/accept-friend", requireAuth, async (req, res, next) => {
  try {
    if (!usingMongo()) {
      const data = await store.readStore();
      const requester = data.users.find((user) => user.id === req.params.id);
      const current = data.users.find((user) => user.id === req.user.id);
      if (!requester || !current) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!(current.friendRequests || []).includes(req.params.id)) {
        return res.status(400).json({ message: "No request from this user" });
      }
      current.friendRequests = (current.friendRequests || []).filter((id) => id !== req.params.id);
      current.friends = Array.from(new Set([...(current.friends || []), req.params.id]));
      requester.friends = Array.from(new Set([...(requester.friends || []), req.user.id]));
      await store.writeStore(data);
      return res.json({ message: "Friend request accepted", user: publicUser(current) });
    }

    const requester = await User.findById(req.params.id);
    const current = await User.findById(req.user.id);

    if (!requester || !current) {
      return res.status(404).json({ message: "User not found" });
    }

    const requested = (current.friendRequests || []).some((id) => id.toString() === req.params.id);
    if (!requested) {
      return res.status(400).json({ message: "No request from this user" });
    }

    await User.updateOne(
      { _id: req.user.id },
      {
        $pull: { friendRequests: req.params.id },
        $addToSet: { friends: req.params.id }
      }
    );
    await User.updateOne({ _id: req.params.id }, { $addToSet: { friends: req.user.id } });
    const updated = await User.findById(req.user.id);
    res.json({ message: "Friend request accepted", user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/friend", requireAuth, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot remove yourself" });
    }

    if (!usingMongo()) {
      const data = await store.readStore();
      const current = data.users.find((user) => user.id === req.user.id);
      const target = data.users.find((user) => user.id === req.params.id);
      if (!current || !target) {
        return res.status(404).json({ message: "User not found" });
      }
      current.friends = (current.friends || []).filter((id) => id !== req.params.id);
      target.friends = (target.friends || []).filter((id) => id !== req.user.id);
      data.messages = (data.messages || []).filter(
        (message) =>
          !(
            (message.sender === req.user.id && message.receiver === req.params.id) ||
            (message.sender === req.params.id && message.receiver === req.user.id)
          )
      );
      await store.writeStore(data);
      return res.status(204).end();
    }

    await User.updateOne({ _id: req.user.id }, { $pull: { friends: req.params.id, friendRequests: req.params.id } });
    await User.updateOne({ _id: req.params.id }, { $pull: { friends: req.user.id, friendRequests: req.user.id } });
    await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: req.params.id },
        { sender: req.params.id, receiver: req.user.id }
      ]
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
