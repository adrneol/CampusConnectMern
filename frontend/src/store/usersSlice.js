import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

export const fetchUsers = createAsyncThunk("users/fetchUsers", async (tag = "") => {
  const query = tag ? `?tag=${encodeURIComponent(tag)}` : "";
  return apiRequest(`/users${query}`);
});

export const sendFriendRequest = createAsyncThunk("users/sendFriendRequest", async (id) => {
  await apiRequest(`/users/${id}/friend-request`, { method: "POST" });
  return id;
});

export const acceptFriendRequest = createAsyncThunk("users/acceptFriendRequest", async (id) => {
  const response = await apiRequest(`/users/${id}/accept-friend`, { method: "POST" });
  return { id, user: response.user };
});

export const removeFriend = createAsyncThunk("users/removeFriend", async (id) => {
  await apiRequest(`/users/${id}/friend`, { method: "DELETE" });
  return id;
});

const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    status: "idle",
    error: ""
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.items = state.items.map((user) =>
          user.id === action.payload ? { ...user, hasSentRequest: true } : user
        );
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.items = state.items.map((user) =>
          user.id === action.payload.id ? { ...user, isFriend: true, hasIncomingRequest: false } : user
        );
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.items = state.items.map((user) =>
          user.id === action.payload ? { ...user, isFriend: false, hasSentRequest: false, hasIncomingRequest: false } : user
        );
      });
  }
});

export default usersSlice.reducer;
