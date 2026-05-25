const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    caption: { type: String, default: "" },
    content: { type: String, default: "" },
    image: { type: String, required: true },
    level: { type: String, default: "Beginner" },
    isDefault: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
