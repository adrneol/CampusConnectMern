import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => apiRequest("/posts"));

export const createPost = createAsyncThunk("posts/createPost", async (payload) =>
  apiRequest("/posts", { method: "POST", body: JSON.stringify(payload) })
);

export const updatePost = createAsyncThunk("posts/updatePost", async ({ id, ...payload }) =>
  apiRequest(`/posts/${id}`, { method: "PUT", body: JSON.stringify(payload) })
);

export const deletePost = createAsyncThunk("posts/deletePost", async (id) => {
  await apiRequest(`/posts/${id}`, { method: "DELETE" });
  return id;
});

export const likePost = createAsyncThunk("posts/likePost", async (id) => apiRequest(`/posts/${id}/like`, { method: "POST" }));
export const favoritePost = createAsyncThunk("posts/favoritePost", async (id) => apiRequest(`/posts/${id}/favorite`, { method: "POST" }));
export const commentPost = createAsyncThunk("posts/commentPost", async ({ id, text }) =>
  apiRequest(`/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ text }) })
);

const postsSlice = createSlice({
  name: "posts",
  initialState: { items: [], status: "idle", error: "" },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.items = state.items.map((post) => (post.id === action.payload.id ? action.payload : post));
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.items = state.items.filter((post) => post.id !== action.payload);
      })
      .addMatcher(
        (action) => ["posts/likePost/fulfilled", "posts/favoritePost/fulfilled", "posts/commentPost/fulfilled"].includes(action.type),
        (state, action) => {
          state.items = state.items.map((post) => (post.id === action.payload.id ? action.payload : post));
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("posts/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.error = action.error.message;
        }
      );
  }
});

export default postsSlice.reducer;
