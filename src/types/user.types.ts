import { Timestamp } from "firebase/firestore";

export type UserRole = "customer" | "admin";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
