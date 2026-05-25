const Course = require("../models/Course");
const store = require("./jsonStore");

const courses = [
  {
    slug: "python",
    title: "Python",
    description: "Beginner-friendly programming notes, examples, and shared study material.",
    caption: "Defaults course",
    content:
      "Python is a high-level language designed for readable programs, fast experimentation, and practical automation. Start with values, variables, conditionals, loops, functions, lists, dictionaries, and modules. Then move into file handling, exceptions, virtual environments, packages, and testing. A strong Python note set should include syntax examples, common errors, small programs, and links or references to the official Python documentation for details such as built-in functions, data model behavior, standard-library modules, and packaging. For projects, practice command-line tools, data parsing, simple web APIs, and notebook-style exploration. Keep notes long enough to explain why an approach works, not only what to type.",
    image: "/assets/images/python.png",
    level: "Beginner",
    isDefault: true
  },
  {
    slug: "html",
    title: "HTML",
    description: "Structure pages, forms, and semantic layouts with practical notes.",
    caption: "Defaults course",
    content:
      "HTML is the structural layer of the web. Good HTML notes should cover document structure, headings, sections, lists, links, images, tables, forms, labels, inputs, buttons, metadata, and accessibility-friendly semantics. Refer to MDN and the HTML Living Standard when you need exact element behavior or valid attributes. Longer study material should explain why semantic tags matter for screen readers, search engines, browser defaults, and maintainable layouts. Include form examples with labels, validation attributes, grouped fields, and sensible button types. Also document common mistakes such as using divs for everything, missing alt text, nesting interactive elements, or skipping heading order.",
    image: "/assets/images/html.png",
    level: "Beginner",
    isDefault: true
  },
  {
    slug: "css",
    title: "CSS",
    description: "Layouts, responsive styling, animations, and design references.",
    caption: "Defaults course",
    content:
      "CSS controls layout, rhythm, color, responsiveness, and interaction states. A complete CSS course note should explain selectors, cascade, specificity, inheritance, box model, display modes, flexbox, grid, positioning, custom properties, media queries, transitions, transforms, and accessible focus states. Use MDN and official CSS specifications as references for property syntax and browser behavior. Practical examples should show responsive cards, forms, navigation bars, dashboards, and print-friendly pages. Add notes about debugging with browser devtools, avoiding layout shifts, managing contrast, and keeping reusable spacing and color tokens consistent across a project.",
    image: "/assets/images/css.jpg",
    level: "Intermediate",
    isDefault: true
  },
  {
    slug: "c",
    title: "C Programming",
    description: "Core C concepts, pointers, arrays, and exam-ready notes.",
    caption: "Defaults course",
    content:
      "C is close to the machine and rewards careful thinking about memory, types, and control flow. Study notes should include variables, operators, conditionals, loops, functions, arrays, strings, pointers, structs, dynamic allocation, files, preprocessing, compilation, and debugging. Good long-form notes explain stack versus heap, pointer arithmetic, null terminators, buffer boundaries, and why undefined behavior matters. Include examples compiled with warnings enabled, plus references to compiler documentation and standard-library references for functions like malloc, free, printf, scanf, fopen, and memcpy. Exam preparation should include dry runs, memory diagrams, and common pointer mistakes.",
    image: "/assets/images/clang.webp",
    level: "Intermediate",
    isDefault: true
  },
  {
    slug: "cpp",
    title: "C++",
    description: "Object oriented programming, STL basics, and problem-solving notes.",
    caption: "Defaults course",
    content:
      "C++ builds on systems programming with stronger abstractions. A useful C++ course should cover classes, objects, constructors, destructors, references, pointers, const correctness, templates, exceptions, RAII, standard containers, iterators, algorithms, strings, streams, and basic modern C++ practices. Refer to cppreference and compiler documentation for standard-library details and language rules. Long notes should compare arrays with vector, manual memory with smart pointers, inheritance with composition, and loops with STL algorithms. Include problem-solving patterns, complexity notes, sample programs, and debugging advice for build errors, linker errors, and runtime memory issues.",
    image: "/assets/images/c++.webp",
    level: "Intermediate",
    isDefault: true
  }
];

async function seedCourses(useMongo) {
  if (useMongo) {
    const count = await Course.countDocuments();
    if (count === 0) {
      await Course.insertMany(courses);
    } else {
      await Promise.all(
        courses.map((course) =>
          Course.updateOne(
            { slug: course.slug },
            { $set: { ...course, isDefault: true } },
            { upsert: true }
          )
        )
      );
    }
    return;
  }

  const data = await store.readStore();
  if (data.courses.length === 0) {
    data.courses = courses.map((course) => ({ ...course, id: store.createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    await store.writeStore(data);
    return;
  }

  let changed = false;
  courses.forEach((course) => {
    const existing = data.courses.find((item) => item.slug === course.slug);
    if (existing) {
      Object.assign(existing, course, { isDefault: true });
      changed = true;
    } else {
      data.courses.push({ ...course, id: store.createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      changed = true;
    }
  });
  if (changed) {
    await store.writeStore(data);
  }
}

module.exports = { courses, seedCourses };
