const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");
const { requireAuth } = require("../middleware/auth");
const { signToken, publicUser } = require("../utils/auth");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function validateResetCode(code) {
  const value = String(code || "");
  return value.length >= 6;
}

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, oneTimeCode } = req.body;

    if (!name || !email || !password || !oneTimeCode) {
      return res.status(400).json({ message: "Name, email, password, and one-time reset code are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!validateResetCode(oneTimeCode)) {
      return res.status(400).json({ message: "One-time reset code must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const resetCodeHash = hashValue(oneTimeCode);
    const username = normalizedEmail.split("@")[0].replace(/[^a-z0-9_]/g, "") || name.toLowerCase().replace(/[^a-z0-9_]/g, "");
    let user;

    if (usingMongo()) {
      const exists = await User.findOne({ email: normalizedEmail });
      if (exists) {
        return res.status(409).json({ message: "Email already registered" });
      }
      user = await User.create({
        name: name.trim(),
        username,
        email: normalizedEmail,
        passwordHash,
        resetCodeHash
      });
    } else {
      const data = await store.readStore();
      const exists = data.users.find((item) => item.email === normalizedEmail);
      if (exists) {
        return res.status(409).json({ message: "Email already registered" });
      }
      user = { id: store.createId(), name: name.trim(), username, email: normalizedEmail, passwordHash, resetCodeHash, tags: [], bio: "" };
      data.users.push(user);
      await store.writeStore(data);
    }

    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user;
    if (usingMongo()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const data = await store.readStore();
      user = data.users.find((item) => item.email === normalizedEmail);
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email, oneTimeCode, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    if (!normalizedEmail || !oneTimeCode || !password) {
      return res.status(400).json({ message: "Email, one-time reset code, and new password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    let user;
    if (usingMongo()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const data = await store.readStore();
      user = data.users.find((item) => item.email === normalizedEmail);
    }

    if (!user || user.resetCodeHash !== hashValue(oneTimeCode)) {
      return res.status(401).json({ message: "Invalid email or one-time reset code" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (usingMongo()) {
      await User.updateOne({ email: normalizedEmail }, { $set: { passwordHash } });
    } else {
      const data = await store.readStore();
      const localUser = data.users.find((item) => item.email === normalizedEmail);
      localUser.passwordHash = passwordHash;
      await store.writeStore(data);
    }

    res.json({ message: "Password updated. You can log in now." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
