const express = require("express");
const Course = require("../models/Course");
const Note = require("../models/Note");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");

const router = express.Router();

function normalizeNote(note, owner) {
  const ownerValue = owner || note.owner;
  const normalizedOwner = ownerValue
    ? {
        id: ownerValue.id || ownerValue._id?.toString(),
        name: ownerValue.name,
        username: ownerValue.username || String(ownerValue.email || "").split("@")[0],
        email: ownerValue.email,
        avatar: ownerValue.avatar || ""
      }
    : null;
  return {
    id: note.id || note._id.toString(),
    title: note.title,
    body: note.body,
    courseSlug: note.courseSlug,
    isPublic: Boolean(note.isPublic),
    files: note.files || [],
    owner: normalizedOwner,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  };
}

async function jsonNotesForUser(userId) {
  const data = await store.readStore();
  return data.notes
    .filter((note) => note.isPublic || note.ownerId === userId)
    .map((note) => {
      const owner = data.users.find((user) => user.id === note.ownerId);
      return normalizeNote(note, owner ? { id: owner.id, name: owner.name, email: owner.email, avatar: owner.avatar || "" } : null);
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const courseSlug = String(req.query.course || "").trim();
    const courseFilter = courseSlug ? { courseSlug } : {};
    if (usingMongo()) {
      const notes = await Note.find({
        ...courseFilter,
        $or: [{ isPublic: true }, { owner: req.user.id }]
      })
        .populate("owner", "name email avatar")
        .sort({ updatedAt: -1 });
      return res.json(notes.map((note) => normalizeNote(note, note.owner)));
    }

    const notes = await jsonNotesForUser(req.user.id);
    res.json(courseSlug ? notes.filter((note) => note.courseSlug === courseSlug) : notes);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, body, courseSlug, isPublic, files } = req.body;

    if (!title || !body || !courseSlug) {
      return res.status(400).json({ message: "Title, body, and course are required" });
    }

    if (usingMongo()) {
      const course = await Course.findOne({ slug: courseSlug });
      if (!course) {
        return res.status(400).json({ message: "Choose an existing course before uploading notes" });
      }
      const ownerId = course.owner?.toString();
      if (!course.isDefault && ownerId && ownerId !== req.user.id) {
        return res.status(403).json({ message: "You can only add notes to courses you created or default courses" });
      }
      const note = await Note.create({
        title: title.trim(),
        body: body.trim(),
        courseSlug,
        isPublic: Boolean(isPublic),
        files: Array.isArray(files) ? files : [],
        owner: req.user.id
      });
      const owner = await User.findById(req.user.id).select("name email avatar");
      return res.status(201).json(normalizeNote(note, owner));
    }

    const data = await store.readStore();
    const course = data.courses.find((item) => item.slug === courseSlug);
    if (!course) {
      return res.status(400).json({ message: "Choose an existing course before uploading notes" });
    }
    if (!course.isDefault && course.ownerId && course.ownerId !== req.user.id) {
      return res.status(403).json({ message: "You can only add notes to courses you created or default courses" });
    }
    const now = new Date().toISOString();
    const note = {
      id: store.createId(),
      title: title.trim(),
      body: body.trim(),
      courseSlug,
      isPublic: Boolean(isPublic),
      files: Array.isArray(files) ? files : [],
      ownerId: req.user.id,
      createdAt: now,
      updatedAt: now
    };
    data.notes.push(note);
    await store.writeStore(data);
    res.status(201).json(normalizeNote(note, req.user));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { title, body, courseSlug, isPublic, files } = req.body;

    if (usingMongo()) {
      const note = await Note.findById(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      if (note.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the uploader can edit this note" });
      }
      if (courseSlug) {
        const course = await Course.findOne({ slug: courseSlug });
        if (!course) {
          return res.status(400).json({ message: "Choose an existing course before uploading notes" });
        }
        const ownerId = course.owner?.toString();
        if (!course.isDefault && ownerId && ownerId !== req.user.id) {
          return res.status(403).json({ message: "You can only move notes to courses you created or default courses" });
        }
      }

      note.title = title || note.title;
      note.body = body || note.body;
      note.courseSlug = courseSlug || note.courseSlug;
      note.isPublic = Boolean(isPublic);
      note.files = Array.isArray(files) ? files : note.files;
      await note.save();
      return res.json(normalizeNote(note, req.user));
    }

    const data = await store.readStore();
    const note = data.notes.find((item) => item.id === req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Only the uploader can edit this note" });
    }
    if (courseSlug) {
      const course = data.courses.find((item) => item.slug === courseSlug);
      if (!course) {
        return res.status(400).json({ message: "Choose an existing course before uploading notes" });
      }
      if (!course.isDefault && course.ownerId && course.ownerId !== req.user.id) {
        return res.status(403).json({ message: "You can only move notes to courses you created or default courses" });
      }
    }

    note.title = title || note.title;
    note.body = body || note.body;
    note.courseSlug = courseSlug || note.courseSlug;
    note.isPublic = Boolean(isPublic);
    note.files = Array.isArray(files) ? files : note.files;
    note.updatedAt = new Date().toISOString();
    await store.writeStore(data);
    res.json(normalizeNote(note, req.user));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (usingMongo()) {
      const note = await Note.findById(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      if (note.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the uploader can delete this note" });
      }
      await note.deleteOne();
      return res.status(204).end();
    }

    const data = await store.readStore();
    const note = data.notes.find((item) => item.id === req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Only the uploader can delete this note" });
    }

    data.notes = data.notes.filter((item) => item.id !== req.params.id);
    await store.writeStore(data);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
