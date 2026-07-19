import fs from "fs";
import path from "path";
import { User, UserRole, UserStatus } from "@/types";

export interface StoredServerUser {
  password?: string;
  otpCode?: string;
  user: User;
}

const STORE_PATH = path.join(process.cwd(), ".data-server-store.json");

// Default initial admin account if store is empty
const INITIAL_ADMIN: StoredServerUser = {
  password: "adminpassword",
  user: {
    id: "usr_admin_default",
    name: "System Admin",
    email: "admin@gogetters.com.ng",
    role: "admin",
    status: "approved",
    streak: 5,
    points: 100,
    completionRate: 100,
    consistency: 100,
    joinedAt: new Date().toISOString(),
  }
};

function readStore(): StoredServerUser[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[ServerStore] Failed reading store file:", err);
  }
  return [INITIAL_ADMIN];
}

function writeStore(users: StoredServerUser[]) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("[ServerStore] Failed writing store file:", err);
  }
}

// Global in-memory fallback for serverless lambda lifecycle
let globalMemoryStore: StoredServerUser[] | null = null;

function getStore(): StoredServerUser[] {
  if (!globalMemoryStore) {
    globalMemoryStore = readStore();
  }
  return globalMemoryStore;
}

function setStore(users: StoredServerUser[]) {
  globalMemoryStore = users;
  writeStore(users);
}

export function saveServerUser(record: StoredServerUser): User {
  const store = getStore();
  const index = store.findIndex(u => u.user.email.toLowerCase() === record.user.email.toLowerCase());
  
  if (index >= 0) {
    store[index] = {
      ...store[index],
      ...record,
      user: { ...store[index].user, ...record.user }
    };
  } else {
    store.push(record);
  }
  setStore(store);
  return record.user;
}

export function getServerUserByEmail(email: string): StoredServerUser | undefined {
  const store = getStore();
  return store.find(u => u.user.email.toLowerCase() === email.trim().toLowerCase());
}

export function getAllServerUsers(): User[] {
  const store = getStore();
  return store.map(u => u.user);
}

export function updateServerUser(id: string, updates: Partial<User>): User | null {
  const store = getStore();
  const index = store.findIndex(u => u.user.id === id);
  if (index >= 0) {
    store[index].user = { ...store[index].user, ...updates };
    setStore(store);
    return store[index].user;
  }
  return null;
}
