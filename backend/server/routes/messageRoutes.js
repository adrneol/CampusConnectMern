const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");

const router = express.Router();

function normalizeMessage(message) {
  return {
    id: message._id.toString(),
    sender: message.sender.toString(),
    receiver: message.receiver.toString(),
    text: message.text,
    readAt: message.readAt,
    createdAt: message.createdAt
  };
}

async function ensureFriends(userId, friendId) {
  if (!usingMongo()) {
    const data = await store.readStore();
    const user = data.users.find((item) => item.id === userId);
    return Boolean(user && (user.friends || []).includes(friendId));
  }
  const user = await User.findById(userId).select("friends");
  return Boolean(user && (user.friends || []).some((id) => id.toString() === friendId));
}

function normalizeJsonMessage(message) {
  return {
    id: message.id,
    sender: message.sender,
    receiver: message.receiver,
    text: message.text,
    readAt: message.readAt || null,
    createdAt: message.createdAt
  };
}

router.get("/:friendId", requireAuth, async (req, res, next) => {
  try {
    if (!(await ensureFriends(req.user.id, req.params.friendId))) {
      return res.status(403).json({ message: "You can only message friends" });
    }

    if (!usingMongo()) {
      const data = await store.readStore();
      const messages = (data.messages || [])
        .filter(
          (message) =>
            (message.sender === req.user.id && message.receiver === req.params.friendId) ||
            (message.sender === req.params.friendId && message.receiver === req.user.id)
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-200);
      messages.forEach((message) => {
        if (message.receiver === req.user.id && !message.readAt) {
          message.readAt = new Date().toISOString();
        }
      });
      await store.writeStore(data);
      return res.json(messages.map(normalizeJsonMessage));
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.friendId },
        { sender: req.params.friendId, receiver: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(200);

    await Message.updateMany({ sender: req.params.friendId, receiver: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
    res.json(messages.map(normalizeMessage));
  } catch (error) {
    next(error);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    if (!usingMongo()) {
      const data = await store.readStore();
      const unreadBySender = {};
      (data.messages || []).forEach((message) => {
        if (message.receiver === req.user.id && !message.readAt) {
          unreadBySender[message.sender] = (unreadBySender[message.sender] || 0) + 1;
        }
      });
      return res.json({
        totalUnread: Object.values(unreadBySender).reduce((sum, count) => sum + count, 0),
        unreadBySender
      });
    }

    const unreadMessages = await Message.find({ receiver: req.user.id, readAt: null }).select("sender");
    const unreadBySender = unreadMessages.reduce((acc, message) => {
      const sender = message.sender.toString();
      acc[sender] = (acc[sender] || 0) + 1;
      return acc;
    }, {});
    res.json({
      totalUnread: Object.values(unreadBySender).reduce((sum, count) => sum + count, 0),
      unreadBySender
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:friendId", requireAuth, async (req, res, next) => {
  try {
    if (!(await ensureFriends(req.user.id, req.params.friendId))) {
      return res.status(403).json({ message: "You can only clear chats with friends" });
    }

    if (!usingMongo()) {
      const data = await store.readStore();
      data.messages = (data.messages || []).filter(
        (message) =>
          !(
            (message.sender === req.user.id && message.receiver === req.params.friendId) ||
            (message.sender === req.params.friendId && message.receiver === req.user.id)
          )
      );
      await store.writeStore(data);
      return res.status(204).end();
    }

    await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: req.params.friendId },
        { sender: req.params.friendId, receiver: req.user.id }
      ]
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = { router, normalizeMessage, ensureFriends };
