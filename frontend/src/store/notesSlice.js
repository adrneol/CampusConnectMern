import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

export const fetchNotes = createAsyncThunk("notes/fetchNotes", async (courseSlug = "") => {
  const query = courseSlug ? `?course=${encodeURIComponent(courseSlug)}` : "";
  return apiRequest(`/notes${query}`);
});

export const createNote = createAsyncThunk("notes/createNote", async (payload) => {
  return apiRequest("/notes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
});

export const updateNote = createAsyncThunk("notes/updateNote", async ({ id, ...payload }) => {
  return apiRequest(`/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
});

export const deleteNote = createAsyncThunk("notes/deleteNote", async (id) => {
  await apiRequest(`/notes/${id}`, { method: "DELETE" });
  return id;
});

const notesSlice = createSlice({
  name: "notes",
  initialState: {
    items: [],
    status: "idle",
    saving: false,
    error: ""
  },
  reducers: {
    clearNotes(state) {
      state.items = [];
      state.status = "idle";
      state.error = "";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createNote.pending, (state) => {
        state.saving = true;
      })
      .addCase(createNote.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
      })
      .addCase(updateNote.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.map((note) => (note.id === action.payload.id ? action.payload : note));
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.items = state.items.filter((note) => note.id !== action.payload);
      })
      .addMatcher(
        (action) => action.type.startsWith("notes/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.saving = false;
          state.error = action.error.message;
        }
      );
  }
});

export const { clearNotes } = notesSlice.actions;
export default notesSlice.reducer;
