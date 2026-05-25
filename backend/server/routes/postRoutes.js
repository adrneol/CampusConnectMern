const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");

const router = express.Router();

function publicOwner(user) {
  if (!user) return null;
  return {
    id: user.id || user._id?.toString(),
    name: user.name,
    username: user.username || String(user.email || "").split("@")[0],
    avatar: user.avatar || ""
  };
}

function normalizePost(post, owner, viewerId) {
  const likes = (post.likes || []).map((id) => id.toString());
  const favorites = (post.favorites || []).map((id) => id.toString());
  return {
    id: post.id || post._id.toString(),
    caption: post.caption || "",
    image: post.image,
    isPublic: Boolean(post.isPublic),
    owner: publicOwner(owner || post.owner),
    likesCount: likes.length,
    favoritesCount: favorites.length,
    likedUsers: (post.likedUsers || []).map(publicOwner),
    likedByMe: likes.includes(viewerId),
    favoritedByMe: favorites.includes(viewerId),
    comments: (post.comments || []).map((comment) => ({
      id: comment.id,
      text: comment.text,
      owner: publicOwner(comment.owner),
      createdAt: comment.createdAt
    })),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    if (usingMongo()) {
      const posts = await Post.find({ $or: [{ isPublic: true }, { owner: req.user.id }] })
        .populate("owner", "name username email avatar")
        .populate("likes", "name username email avatar")
        .populate("comments.owner", "name username email avatar")
        .sort({ updatedAt: -1 });
      return res.json(posts.map((post) => normalizePost({ ...post.toObject(), likedUsers: post.likes }, post.owner, req.user.id)));
    }
    const data = await store.readStore();
    const posts = (data.posts || [])
      .filter((post) => post.isPublic || post.ownerId === req.user.id)
      .map((post) => {
        const owner = data.users.find((user) => user.id === post.ownerId);
        const comments = (post.comments || []).map((comment) => ({
          ...comment,
          owner: data.users.find((user) => user.id === comment.ownerId)
        }));
        const likedUsers = (post.likes || []).map((id) => data.users.find((user) => user.id === id)).filter(Boolean);
        return normalizePost({ ...post, comments, likedUsers }, owner, req.user.id);
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { caption, image, isPublic } = req.body;
    if (!image) return res.status(400).json({ message: "Post image is required" });
    if (usingMongo()) {
      const post = await Post.create({ caption: String(caption || "").trim(), image, isPublic: isPublic !== false, owner: req.user.id });
      const owner = await User.findById(req.user.id).select("name username email avatar");
      return res.status(201).json(normalizePost({ ...post.toObject(), likedUsers: [] }, owner, req.user.id));
    }
    const data = await store.readStore();
    const now = new Date().toISOString();
    const post = {
      id: store.createId(),
      caption: String(caption || "").trim(),
      image,
      isPublic: isPublic !== false,
      ownerId: req.user.id,
      likes: [],
      favorites: [],
      comments: [],
      createdAt: now,
      updatedAt: now
    };
    data.posts = data.posts || [];
    data.posts.push(post);
    await store.writeStore(data);
    res.status(201).json(normalizePost(post, req.user, req.user.id));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { caption, isPublic } = req.body;
    if (usingMongo()) {
      const post = await Post.findById(req.params.id).populate("owner", "name username email avatar").populate("comments.owner", "name username email avatar");
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (post.owner._id.toString() !== req.user.id) return res.status(403).json({ message: "Only the uploader can edit this post" });
      post.caption = String(caption || "").trim();
      post.isPublic = Boolean(isPublic);
      await post.save();
      return res.json(normalizePost({ ...post.toObject(), likedUsers: [] }, post.owner, req.user.id));
    }
    const data = await store.readStore();
    const post = (data.posts || []).find((item) => item.id === req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.ownerId !== req.user.id) return res.status(403).json({ message: "Only the uploader can edit this post" });
    post.caption = String(caption || "").trim();
    post.isPublic = Boolean(isPublic);
    post.updatedAt = new Date().toISOString();
    await store.writeStore(data);
    res.json(normalizePost(post, req.user, req.user.id));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (usingMongo()) {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: "Post not found" });
      if (post.owner.toString() !== req.user.id) return res.status(403).json({ message: "Only the uploader can delete this post" });
      await post.deleteOne();
      return res.status(204).end();
    }
    const data = await store.readStore();
    const post = (data.posts || []).find((item) => item.id === req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.ownerId !== req.user.id) return res.status(403).json({ message: "Only the uploader can delete this post" });
    data.posts = data.posts.filter((item) => item.id !== req.params.id);
    await store.writeStore(data);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/like", requireAuth, async (req, res, next) => {
  try {
    if (usingMongo()) {
      const post = await Post.findById(req.params.id);
      if (!post || (!post.isPublic && post.owner.toString() !== req.user.id)) return res.status(404).json({ message: "Post not found" });
      const liked = post.likes.some((id) => id.toString() === req.user.id);
      post.likes = liked ? post.likes.filter((id) => id.toString() !== req.user.id) : [...post.likes, req.user.id];
      await post.save();
      await post.populate("owner", "name username email avatar");
      await post.populate("likes", "name username email avatar");
      await post.populate("comments.owner", "name username email avatar");
      return res.json(normalizePost({ ...post.toObject(), likedUsers: post.likes }, post.owner, req.user.id));
    }
    const data = await store.readStore();
    const post = (data.posts || []).find((item) => item.id === req.params.id && (item.isPublic || item.ownerId === req.user.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.likes = post.likes || [];
    post.likes = post.likes.includes(req.user.id) ? post.likes.filter((id) => id !== req.user.id) : [...post.likes, req.user.id];
    post.updatedAt = new Date().toISOString();
    await store.writeStore(data);
    const owner = data.users.find((user) => user.id === post.ownerId);
    const likedUsers = (post.likes || []).map((id) => data.users.find((user) => user.id === id)).filter(Boolean);
    res.json(normalizePost({ ...post, likedUsers }, owner, req.user.id));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/favorite", requireAuth, async (req, res, next) => {
  try {
    if (usingMongo()) {
      const post = await Post.findById(req.params.id);
      if (!post || (!post.isPublic && post.owner.toString() !== req.user.id)) return res.status(404).json({ message: "Post not found" });
      const favored = post.favorites.some((id) => id.toString() === req.user.id);
      post.favorites = favored ? post.favorites.filter((id) => id.toString() !== req.user.id) : [...post.favorites, req.user.id];
      await post.save();
      await post.populate("owner", "name username email avatar");
      await post.populate("likes", "name username email avatar");
      await post.populate("comments.owner", "name username email avatar");
      return res.json(normalizePost({ ...post.toObject(), likedUsers: post.likes }, post.owner, req.user.id));
    }
    const data = await store.readStore();
    const post = (data.posts || []).find((item) => item.id === req.params.id && (item.isPublic || item.ownerId === req.user.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.favorites = post.favorites || [];
    post.favorites = post.favorites.includes(req.user.id) ? post.favorites.filter((id) => id !== req.user.id) : [...post.favorites, req.user.id];
    post.updatedAt = new Date().toISOString();
    await store.writeStore(data);
    const owner = data.users.find((user) => user.id === post.ownerId);
    const favoriteLikedUsers = (post.likes || []).map((id) => data.users.find((user) => user.id === id)).filter(Boolean);
    res.json(normalizePost({ ...post, likedUsers: favoriteLikedUsers }, owner, req.user.id));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment is required" });
    if (usingMongo()) {
      const post = await Post.findById(req.params.id);
      if (!post || (!post.isPublic && post.owner.toString() !== req.user.id)) return res.status(404).json({ message: "Post not found" });
      post.comments.push({ id: Date.now().toString(36), text, owner: req.user.id });
      await post.save();
      await post.populate("owner", "name username email avatar");
      await post.populate("likes", "name username email avatar");
      await post.populate("comments.owner", "name username email avatar");
      return res.status(201).json(normalizePost({ ...post.toObject(), likedUsers: post.likes }, post.owner, req.user.id));
    }
    const data = await store.readStore();
    const post = (data.posts || []).find((item) => item.id === req.params.id && (item.isPublic || item.ownerId === req.user.id));
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments = post.comments || [];
    post.comments.push({ id: store.createId(), text, ownerId: req.user.id, createdAt: new Date().toISOString() });
    post.updatedAt = new Date().toISOString();
    await store.writeStore(data);
    const owner = data.users.find((user) => user.id === post.ownerId);
    const comments = post.comments.map((comment) => ({ ...comment, owner: data.users.find((user) => user.id === comment.ownerId) }));
    const commentLikedUsers = (post.likes || []).map((id) => data.users.find((user) => user.id === id)).filter(Boolean);
    res.status(201).json(normalizePost({ ...post, comments, likedUsers: commentLikedUsers }, owner, req.user.id));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
