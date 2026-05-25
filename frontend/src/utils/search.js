export function matchesCourse(course, query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    course.title,
    course.slug,
    course.caption,
    course.description,
    course.content,
    course.level,
    course.owner?.name,
    course.owner?.username
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes(needle)) return true;

  for (let size = Math.min(needle.length, 4); size >= 3; size -= 1) {
    for (let index = 0; index <= needle.length - size; index += 1) {
      if (haystack.includes(needle.slice(index, index + size))) return true;
    }
  }

  return false;
}
