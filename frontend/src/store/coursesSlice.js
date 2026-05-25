import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

export const fetchCourses = createAsyncThunk("courses/fetchCourses", async () => {
  return apiRequest("/courses");
});

export const createCourse = createAsyncThunk("courses/createCourse", async (payload) => {
  return apiRequest("/courses", {
    method: "POST",
    body: JSON.stringify(payload)
  });
});

export const deleteCourse = createAsyncThunk("courses/deleteCourse", async (id) => {
  await apiRequest(`/courses/${id}`, { method: "DELETE" });
  return id;
});

export const updateCourse = createAsyncThunk("courses/updateCourse", async ({ id, ...payload }) => {
  return apiRequest(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
});

const coursesSlice = createSlice({
  name: "courses",
  initialState: {
    items: [],
    status: "idle",
    error: ""
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.items = state.items.filter((course) => course.id !== action.payload);
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.items = state.items.map((course) => (course.id === action.payload.id ? action.payload : course));
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  }
});

export default coursesSlice.reducer;
