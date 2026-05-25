import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import coursesReducer from "./coursesSlice";
import notesReducer from "./notesSlice";
import usersReducer from "./usersSlice";
import postsReducer from "./postsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    notes: notesReducer,
    users: usersReducer,
    posts: postsReducer
  }
});
