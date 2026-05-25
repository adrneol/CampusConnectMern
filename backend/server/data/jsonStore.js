const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname);
const dataFile = path.join(dataDir, "db.json");

const initialState = {
  users: [],
  courses: [],
  notes: [],
  messages: [],
  posts: []
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await writeStore(initialState);
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  const data = JSON.parse(raw);
  data.users = data.users || [];
  data.courses = data.courses || [];
  data.notes = data.notes || [];
  data.messages = data.messages || [];
  data.posts = data.posts || [];
  return data;
}

async function writeStore(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

function createId() {
  return crypto.randomUUID();
}

module.exports = { ensureStore, readStore, writeStore, createId };
