const mongoose = require("mongoose");
require("dotenv").config();

const store = require("../data/jsonStore");
const User = require("../models/User");
const Course = require("../models/Course");
const Note = require("../models/Note");
const { courses } = require("../data/seed");

async function migrate() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const data = await store.readStore();

  for (const course of courses) {
    await Course.updateOne({ slug: course.slug }, { $setOnInsert: course }, { upsert: true });
  }
  console.log(`Courses ready: ${courses.length}`);

  const userIdMap = new Map();
  for (const localUser of data.users) {
    const user = await User.findOneAndUpdate(
      { email: localUser.email },
      {
        $setOnInsert: {
          name: localUser.name,
          email: localUser.email,
          passwordHash: localUser.passwordHash
        }
      },
      { new: true, upsert: true }
    );
    userIdMap.set(localUser.id, user._id);
  }
  console.log(`Users migrated/linked: ${userIdMap.size}`);

  let migratedNotes = 0;
  for (const localNote of data.notes) {
    const owner = userIdMap.get(localNote.ownerId);
    if (!owner) {
      console.warn(`Skipped note without owner: ${localNote.title}`);
      continue;
    }

    const exists = await Note.findOne({
      owner,
      title: localNote.title,
      body: localNote.body,
      courseSlug: localNote.courseSlug
    });

    if (exists) {
      continue;
    }

    await Note.create({
      title: localNote.title,
      body: localNote.body,
      courseSlug: localNote.courseSlug,
      isPublic: localNote.isPublic,
      owner,
      createdAt: localNote.createdAt,
      updatedAt: localNote.updatedAt
    });
    migratedNotes += 1;
  }
  console.log(`Notes migrated: ${migratedNotes}`);

  await mongoose.disconnect();
  console.log("Migration complete.");
}

migrate().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
