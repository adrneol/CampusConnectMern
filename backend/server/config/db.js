const mongoose = require("mongoose");
const store = require("../data/jsonStore");
const { seedCourses } = require("../data/seed");

let storageMode = "starting";

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    storageMode = "json";
    await store.ensureStore();
    await seedCourses(false);
    console.log("MONGO_URI not set. Using local JSON storage.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    storageMode = "mongo";
    await seedCourses(true);
    console.log("Connected to MongoDB.");
  } catch (error) {
    storageMode = "error";
    console.error("MongoDB connection failed. Data was NOT saved to local JSON because MONGO_URI is set.");
    console.error(error.message);
    throw error;
  }
}

function usingMongo() {
  return storageMode === "mongo";
}

function getStorageMode() {
  return storageMode;
}

module.exports = { connectDatabase, usingMongo, getStorageMode };
