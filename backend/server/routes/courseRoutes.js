const express = require("express");
const Course = require("../models/Course");
const Note = require("../models/Note");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { usingMongo } = require("../config/db");
const store = require("../data/jsonStore");

const router = express.Router();

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `course-${Date.now()}`;
}

function normalizeCourse(course, owner) {
  const ownerValue = owner || course.owner;
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
    id: course.id || course._id.toString(),
    slug: course.slug,
    title: course.title,
    description: course.description,
    caption: course.caption || "",
    content: course.content || "",
    image: course.image,
    level: course.level || "Beginner",
    isDefault: Boolean(course.isDefault),
    owner: normalizedOwner,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt
  };
}

router.get("/", async (req, res, next) => {
  try {
    if (usingMongo()) {
      const courses = await Course.find().populate("owner", "name email avatar").sort({ isDefault: -1, title: 1 });
      return res.json(courses.map((course) => normalizeCourse(course, course.owner)));
    }

    const data = await store.readStore();
    const courses = data.courses
      .map((course) => {
        const owner = data.users.find((user) => user.id === course.ownerId);
        return normalizeCourse(course, owner ? { id: owner.id, name: owner.name, email: owner.email, avatar: owner.avatar || "" } : null);
      })
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.title.localeCompare(b.title));
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, description, caption, image, content, level } = req.body;
    if (!title || !description || !image) {
      return res.status(400).json({ message: "Course name, caption, and image are required" });
    }

    if (usingMongo()) {
      let slug = slugify(title);
      const exists = await Course.exists({ slug });
      if (exists) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
      const course = await Course.create({
        slug,
        title: title.trim(),
        description: description.trim(),
        caption: String(caption || "").trim(),
        content: String(content || "").trim(),
        image,
        level: String(level || "Community").trim(),
        isDefault: false,
        owner: req.user.id
      });
      const owner = await User.findById(req.user.id).select("name email avatar");
      return res.status(201).json(normalizeCourse(course, owner));
    }

    const data = await store.readStore();
    let slug = slugify(title);
    if (data.courses.some((course) => course.slug === slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    const now = new Date().toISOString();
    const course = {
      id: store.createId(),
      slug,
      title: title.trim(),
      description: description.trim(),
      caption: String(caption || "").trim(),
      content: String(content || "").trim(),
      image,
      level: String(level || "Community").trim(),
      isDefault: false,
      ownerId: req.user.id,
      createdAt: now,
      updatedAt: now
    };
    data.courses.push(course);
    await store.writeStore(data);
    res.status(201).json(normalizeCourse(course, req.user));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { title, description, caption, image, content, level } = req.body;
    if (usingMongo()) {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (course.isDefault) return res.status(403).json({ message: "Default courses cannot be edited" });
      if (!course.owner || course.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the creator can edit this course" });
      }
      course.title = String(title || course.title).trim();
      course.description = String(description || course.description).trim();
      course.caption = String(caption || "").trim();
      course.content = String(content || "").trim();
      course.level = String(level || course.level).trim();
      course.image = image || course.image;
      await course.save();
      const owner = await User.findById(req.user.id).select("name username email avatar");
      return res.json(normalizeCourse(course, owner));
    }

    const data = await store.readStore();
    const course = data.courses.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.isDefault) return res.status(403).json({ message: "Default courses cannot be edited" });
    if (course.ownerId !== req.user.id) return res.status(403).json({ message: "Only the creator can edit this course" });
    course.title = String(title || course.title).trim();
    course.description = String(description || course.description).trim();
    course.caption = String(caption || "").trim();
    course.content = String(content || "").trim();
    course.level = String(level || course.level).trim();
    course.image = image || course.image;
    course.updatedAt = new Date().toISOString();
    await store.writeStore(data);
    res.json(normalizeCourse(course, req.user));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (usingMongo()) {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      if (course.isDefault) {
        return res.status(403).json({ message: "Default courses cannot be deleted" });
      }
      if (!course.owner || course.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the creator can delete this course" });
      }
      await Note.deleteMany({ courseSlug: course.slug, owner: req.user.id });
      await course.deleteOne();
      return res.status(204).end();
    }

    const data = await store.readStore();
    const course = data.courses.find((item) => item.id === req.params.id || item.slug === req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (course.isDefault) {
      return res.status(403).json({ message: "Default courses cannot be deleted" });
    }
    if (course.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Only the creator can delete this course" });
    }
    data.courses = data.courses.filter((item) => item.id !== course.id);
    data.notes = data.notes.filter((note) => note.courseSlug !== course.slug || note.ownerId !== req.user.id);
    await store.writeStore(data);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
