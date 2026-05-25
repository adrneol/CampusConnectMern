import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "./api";

const savedUser = localStorage.getItem("campusConnectUser");
const savedToken = localStorage.getItem("campusConnectToken");

export const signup = createAsyncThunk("auth/signup", async (payload) => {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
});

export const forgotPassword = createAsyncThunk("auth/forgotPassword", async (payload) => {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
});

export const updateProfile = createAsyncThunk("auth/updateProfile", async (payload) => {
  return apiRequest("/users/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
});

export const deleteAccount = createAsyncThunk("auth/deleteAccount", async (payload) => {
  await apiRequest("/users/me", {
    method: "DELETE",
    body: JSON.stringify(payload)
  });
  return true;
});

export const login = createAsyncThunk("auth/login", async (payload) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    status: "idle",
    error: ""
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("campusConnectUser");
      localStorage.removeItem("campusConnectToken");
    },
    clearAuthError(state) {
      state.error = "";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("campusConnectUser", JSON.stringify(action.payload.user));
        localStorage.setItem("campusConnectToken", action.payload.token);
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("campusConnectUser", JSON.stringify(action.payload.user));
        localStorage.setItem("campusConnectToken", action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem("campusConnectUser", JSON.stringify(action.payload.user));
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem("campusConnectUser");
        localStorage.removeItem("campusConnectToken");
      });
  }
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
