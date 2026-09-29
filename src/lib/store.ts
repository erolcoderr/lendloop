"use client";

import { create } from "zustand";
import type {
  User,
  Item,
  BorrowRequest,
  Review,
  AppNotification,
  SocialLink,
  Message,
  ViewName,
} from "./types";
import { api, apiPost, apiPatch, apiDelete, apiGet } from "./api-client";

/**
 * LendLoop client store — backed by MySQL via Next.js API routes.
 *
 * Architecture:
 *  - MySQL is the single source of truth (via Prisma + API routes).
 *  - This Zustand store is a client-side CACHE hydrated from /api/hydrate on
 *    app mount. No localStorage persistence — a page refresh re-fetches.
 *  - Mutations call the API first; on success they update the local cache so
 *    the UI updates instantly without a full refetch.
 *  - Method signatures intentionally match the old mock-data store so existing
 *    views need only minimal changes (await the now-async actions).
 */

/* =============================================================== router */

interface RouterStore {
  view: ViewName;
  params: Record<string, string>;
  history: { view: ViewName; params: Record<string, string> }[];
  navigate: (view: ViewName, params?: Record<string, string>) => void;
  back: () => void;
  reset: () => void;
}

export const useRouter = create<RouterStore>((set, get) => ({
  view: "landing",
  params: {},
  history: [],
  navigate: (view, params = {}) => {
    const { view: curView, params: curParams, history } = get();
    if (curView === view && JSON.stringify(curParams) === JSON.stringify(params)) return;
    set({
      view,
      params,
      history: [...history, { view: curView, params: curParams }].slice(-12),
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  },
  back: () => {
    const { history } = get();
    if (history.length === 0) {
      set({ view: "landing", params: {} });
      return;
    }
    const prev = history[history.length - 1];
    set({
      view: prev.view,
      params: prev.params,
      history: history.slice(0, -1),
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  },
  reset: () => set({ view: "landing", params: {}, history: [] }),
}));

/* ================================================================= auth */

interface AuthStore {
  currentUserId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<{ ok: boolean; error?: string }>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    barangay: string;
    city: string;
    avatar: string;
    faceImage: string;
    idImage: string;
  }) => Promise<{ ok: boolean; pending?: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set, get) => ({
  currentUserId: null,
  hydrated: false,
  /** Fetch the current session + all data in one call (called by AppHydrator). */
  hydrate: async () => {
    try {
      const data = await api<{
        me: User | null;
        users: User[];
        items: Item[];
        requests: BorrowRequest[];
        reviews: Review[];
        notifications: AppNotification[];
        trustMap?: Record<string, number>;
      }>("/api/hydrate");
      useData.setState({
        users: data.users,
        items: data.items,
        requests: data.requests,
        reviews: data.reviews,
        notifications: data.notifications,
        trustMap: data.trustMap ?? {},
      });
      set({ currentUserId: data.me?.id ?? null, hydrated: true });
    } catch (e) {
      // Mark hydrated so the UI isn't stuck on the splash screen forever,
      // but re-throw so AppHydrator can show the "database unreachable" screen.
      set({ hydrated: true });
      throw e;
    }
  },
  login: async (email, password, remember) => {
    try {
      const res = await apiPost<{ user: User }>("/api/auth/login", { email, password, remember: Boolean(remember) });
      // Refresh the local cache so the new user's notifications appear.
      await get().hydrate();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Login failed." };
    }
  },
  register: async (payload) => {
    try {
      // The API returns { pending: true, message } — it does NOT set a session.
      // The user must wait for admin approval before logging in.
      await apiPost("/api/auth/register", payload);
      return { ok: true, pending: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Registration failed." };
    }
  },
  logout: async () => {
    await apiPost("/api/auth/logout").catch(() => {});
    set({ currentUserId: null });
    useData.setState({ notifications: [] });
  },
}));

/* ================================================================= data */

interface DataStore {
  users: User[];
  items: Item[];
  requests: BorrowRequest[];
  reviews: Review[];
  notifications: AppNotification[];
  trustMap: Record<string, number>;
  // Per-user social links (kept here for shared trust-bonus math, but each
  // view fetches its own list — the hydrate endpoint doesn't return them).
  socialLinks: SocialLink[];
  // Messages for the active chat session only — replaced whenever the user
  // opens a different borrow-request thread.
  messages: Message[];
  // actions — all async now (call API, then update local cache)
  addUser: (u: User) => void;
  addRequest: (r: BorrowRequest) => void;
  updateRequest: (id: string, patch: Partial<BorrowRequest>) => void;
  addItem: (i: Item) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addReview: (r: Review) => void;
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  setUserStatus: (id: string, status: "active" | "suspended") => void;
  setSocialLinks: (links: SocialLink[]) => void;
  addSocialLinkLocal: (link: SocialLink) => void;
  deleteSocialLinkLocal: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessageLocal: (message: Message) => void;
  resetData: () => void;
}

export const useData = create<DataStore>((set) => ({
  users: [],
  items: [],
  requests: [],
  reviews: [],
  notifications: [],
  trustMap: {},
  socialLinks: [],
  messages: [],
  // Local-only cache mutators (the API route already did the real write).
  // Kept so views that call the store directly still update the UI.
  addUser: (u) => set((s) => ({ users: [...s.users, u] })),
  addRequest: (r) => set((s) => ({ requests: [r, ...s.requests] })),
  updateRequest: (id, patch) =>
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      // Also sync the related item's status for visual consistency.
      items: syncItemFromRequest(s.items, id, patch),
    })),
  addItem: (i) => set((s) => ({ items: [i, ...s.items] })),
  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
  deleteItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  addReview: (r) => set((s) => ({ reviews: [r, ...s.reviews] })),
  addNotification: (n) =>
    set((s) => ({ notifications: [n, ...s.notifications] })),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: (userId) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    })),
  setUserStatus: (id, status) =>
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, status } : u)),
    })),
  setSocialLinks: (links) => set({ socialLinks: links }),
  addSocialLinkLocal: (link) =>
    set((s) => ({ socialLinks: [...s.socialLinks, link] })),
  deleteSocialLinkLocal: (id) =>
    set((s) => ({ socialLinks: s.socialLinks.filter((l) => l.id !== id) })),
  setMessages: (messages) => set({ messages }),
  addMessageLocal: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  resetData: () =>
    set({
      users: [],
      items: [],
      requests: [],
      reviews: [],
      notifications: [],
      socialLinks: [],
      messages: [],
    }),
}));

/** When a request's status changes, mirror the item status for the UI. */
function syncItemFromRequest(items: Item[], requestId: string, patch: Partial<BorrowRequest>): Item[] {
  if (patch.status === undefined) return items;
  // We don't have the itemId here cheaply; the view already calls updateItem
  // explicitly when needed, so this is a best-effort no-op fallback.
  return items;
}

/* ==================================================== derived selectors */

/** Helper hook: the currently logged-in user object (or null). */
export function useCurrentUser(): User | null {
  const id = useAuth((s) => s.currentUserId);
  const users = useData((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
}

/* =================================================== API-backed actions */

/**
 * Higher-level async helpers that call the API AND update the local cache.
 * Views should prefer these over calling the raw store mutators.
 */
export const actions = {
  async createItem(payload: {
    title: string;
    description: string;
    category: string;
    condition: string;
    images: string[];
    primaryImageIndex: number;
    maxBorrowDays: number;
    deposit: number;
    location: string;
  }): Promise<Item> {
    const res = await apiPost<{ item: Item }>("/api/items", payload);
    useData.getState().addItem(res.item);
    return res.item;
  },

  async updateItem(id: string, patch: Record<string, unknown>): Promise<Item> {
    const res = await apiPatch<{ item: Item }>(`/api/items/${id}`, patch);
    useData.getState().updateItem(id, res.item);
    return res.item;
  },

  async deleteItem(id: string): Promise<void> {
    await apiDelete(`/api/items/${id}`);
    useData.getState().deleteItem(id);
  },

  async createRequest(payload: {
    itemId: string;
    startDate: string;
    endDate: string;
    message: string;
    agreementSigned: boolean;
    signatureName: string;
    agreementText?: string;
    wantsCopy?: boolean;
  }): Promise<BorrowRequest> {
    const res = await apiPost<{ request: BorrowRequest }>("/api/requests", payload);
    useData.getState().addRequest(res.request);
    // Also mark the item reserved locally for instant feedback.
    const item = useData.getState().items.find((i) => i.id === payload.itemId);
    if (item) {
      useData.getState().updateItem(item.id, { status: "reserved" });
    }
    return res.request;
  },

  async updateRequestStatus(id: string, status: BorrowRequest["status"]): Promise<BorrowRequest> {
    const res = await apiPatch<{ request: BorrowRequest }>(`/api/requests/${id}`, { status });
    useData.getState().updateRequest(id, { status: res.request.status, borrowedAt: res.request.borrowedAt, returnedAt: res.request.returnedAt });
    // Sync the item status locally from the returned request.
    const itemId = res.request.itemId;
    const itemStatus =
      status === "approved" ? "reserved" :
      status === "borrowed" ? "borrowed" :
      status === "returned" ? "available" :
      undefined;
    if (itemStatus) useData.getState().updateItem(itemId, { status: itemStatus });
    return res.request;
  },

  async createReview(payload: {
    toUserId: string;
    itemId: string;
    requestId?: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    const res = await apiPost<{ review: Review }>("/api/reviews", payload);
    useData.getState().addReview(res.review);
    return res.review;
  },

  async markNotificationRead(id: string): Promise<void> {
    useData.getState().markNotificationRead(id); // optimistic
    await apiPatch(`/api/notifications/${id}`).catch(() => {});
  },

  async markAllRead(userId: string): Promise<void> {
    useData.getState().markAllRead(userId); // optimistic
    await apiPatch("/api/notifications").catch(() => {});
  },

  async setUserStatus(id: string, status: "active" | "suspended"): Promise<void> {
    useData.getState().setUserStatus(id, status); // optimistic
    await apiPatch(`/api/users/${id}`, { status }).catch(() => {});
  },

  async updateProfile(id: string, patch: {
    name?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    barangay?: string;
    city?: string;
  }): Promise<User> {
    const res = await apiPatch<{ user: User }>(`/api/users/${id}`, patch);
    useData.setState((s) => ({
      users: s.users.map((u) => (u.id === id ? res.user : u)),
    }));
    return res.user;
  },

  /* ------------------------------------------------- social links */

  /**
   * Add a social link for the current user. The server creates it as
   * `pending` with a default bonus of 1 and notifies the admins.
   */
  async addSocialLink(payload: {
    platform: string;
    url: string;
  }): Promise<SocialLink> {
    const res = await apiPost<{ link: SocialLink }>("/api/social-links", payload);
    useData.getState().addSocialLinkLocal(res.link);
    return res.link;
  },

  /** Delete a social link owned by the current user. */
  async deleteSocialLink(id: string): Promise<void> {
    await apiDelete(`/api/social-links/${id}`);
    useData.getState().deleteSocialLinkLocal(id);
  },

  /* ------------------------------------------------------- chat */

  /** Fetch the message thread for a borrow request (replaces the active session). */
  async fetchMessages(requestId: string): Promise<Message[]> {
    const res = await apiGet<{ messages: Message[] }>(
      `/api/messages?requestId=${encodeURIComponent(requestId)}`,
    );
    useData.getState().setMessages(res.messages);
    return res.messages;
  },

  /** Send a message in the active borrow-request thread. */
  async sendMessage(requestId: string, content: string): Promise<Message> {
    const res = await apiPost<{ message: Message }>("/api/messages", {
      requestId,
      content,
    });
    useData.getState().addMessageLocal(res.message);
    return res.message;
  },

  /* ------------------------------------------------------- trust adjustments */

  /** Admin adjusts a user's trust score (bonus or deduction). */
  async adjustTrust(userId: string, amount: number, reason: string): Promise<void> {
    await apiPost("/api/trust", { userId, amount, reason });
    // Update the local trustMap so the UI reflects the change immediately.
    useData.setState((s) => ({
      trustMap: {
        ...s.trustMap,
        [userId]: (s.trustMap[userId] ?? 0) + amount,
      },
    }));
  },
};
