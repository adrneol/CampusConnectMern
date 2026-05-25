function normalizeTags(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[,\s]+/);

  return [...new Set(
    list
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
  )].slice(0, 20);
}

module.exports = { normalizeTags };
