import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { userAPI } from '../../services/api';

/**
 * User state interface for Redux store
 */
interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    role: 'ALL' | 'ADMIN' | 'USER';
    status: 'ALL' | 'ENABLED' | 'DISABLED';
  };
  sortBy: {
    field: 'firstName' | 'lastName' | 'email' | 'role' | 'createdAt';
    direction: 'asc' | 'desc';
  };
}

/**
 * Initial state for user slice
 */
const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    role: 'ALL',
    status: 'ALL',
  },
  sortBy: {
    field: 'firstName',
    direction: 'asc',
  },
};

/**
 * Async thunk for fetching all users
 */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    const response = await userAPI.getAll();
    return response.data;
  }
);

/**
 * Async thunk for updating user
 */
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }: { id: string; userData: Partial<User> }) => {
    const response = await userAPI.update(id, userData);
    return response.data;
  }
);

/**
 * Async thunk for deleting user
 */
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string) => {
    await userAPI.delete(id);
    return id;
  }
);

/**
 * User slice with reducers and actions
 */
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<UserState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSortBy: (state, action: PayloadAction<UserState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex(u => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload);
      });
  },
});

export const { setFilters, setSortBy, clearError } = userSlice.actions;
export default userSlice.reducer;