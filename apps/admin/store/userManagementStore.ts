import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  createdAt: Date;
  [key: string]: any;
}

interface UserManagementState {
  users: User[];
  selectedUsers: string[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setUsers: (users: User[]) => void;
  setTotalCount: (count: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleUserSelection: (userId: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  reset: () => void;
}

const initialState = {
  users: [],
  selectedUsers: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

export const useUserManagementStore = create<UserManagementState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUsers: (users) => set({ users }),

      setTotalCount: (count) => set({ totalCount: count }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      toggleUserSelection: (userId) =>
        set((state) => ({
          selectedUsers: state.selectedUsers.includes(userId)
            ? state.selectedUsers.filter((id) => id !== userId)
            : [...state.selectedUsers, userId],
        })),

      selectAllUsers: () =>
        set((state) => ({
          selectedUsers: state.users.map((user) => user.id),
        })),

      clearSelection: () => set({ selectedUsers: [] }),

      setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

      reset: () => set(initialState),
    }),
    { name: 'User Management Store' }
  )
);