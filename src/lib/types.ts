/**
 * LendLoop domain types.
 *
 * These mirror the UI state machines defined in the project brief:
 *  - borrowRequest: pending -> approved -> borrowed -> returned (rejected/cancelled are terminal)
 *  - item:          available -> reserved -> borrowed -> available (on return)
 *  - reservation:   active -> fulfilled | cancelled | expired
 *
 * Mock data lives in mock-data.ts and is seeded into the Zustand `data` store
 * (persisted to localStorage) so the prototype behaves like a real session.
 */

export type Role = "user" | "admin";

export type UserStatus = "active" | "suspended";

export type ItemCategory =
  | "Tools"
  | "Outdoor"
  | "Electronics"
  | "Kitchen"
  | "Party"
  | "Sports"
  | "Books"
  | "Vehicles";

export type ItemCondition = "Like New" | "Good" | "Fair";

/** Mirrors the item_ui state machine. */
export type ItemStatus = "available" | "reserved" | "borrowed";

/** Mirrors the borrow_request_ui state machine. */
export type RequestStatus =
  | "pending"
  | "approved"
  | "borrowed"
  | "returned"
  | "rejected"
  | "cancelled";

/** Mirrors the reservation_ui state machine. */
export type ReservationStatus = "active" | "fulfilled" | "cancelled" | "expired";

export type NotificationType =
  | "request_received"
  | "request_approved"
  | "request_rejected"
  | "borrow_started"
  | "return_reminder"
  | "item_returned"
  | "review_received"
  | "verification_approved"
  | "verification_rejected"
  | "system";

/** Face/ID verification lifecycle. */
export type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  /** Who wrote the review. */
  fromUserId: string;
  /** Whose trust score this review affects. */
  toUserId: string;
  itemId: string;
  requestId?: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string; // ISO
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // mock only — never do this for real
  avatar: string;
  barangay: string; // community / neighborhood
  city: string;
  role: Role;
  status: UserStatus;
  verified: boolean;
  joinedAt: string; // ISO
  bio?: string;
  phone?: string;
  // Face/ID verification
  verificationStatus: VerificationStatus;
  faceImage?: string;
  idImage?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
  verificationNote?: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  images: string[];
  primaryImageIndex: number;
  ownerId: string;
  maxBorrowDays: number;
  /** Refundable deposit in PHP, shown to build trust. */
  deposit: number;
  /** ISO dates already booked (from mock reservations / active borrows). */
  bookedDates: string[];
  status: ItemStatus;
  location: string;
  createdAt: string;
  views: number;
}

export interface BorrowRequest {
  id: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  message: string;
  status: RequestStatus;
  /** Digital agreement acceptance. */
  agreementSigned: boolean;
  signatureName: string;
  agreementText?: string;
  wantsCopy: boolean;
  createdAt: string;
  /** When the item physically changed hands. */
  borrowedAt?: string;
  returnedAt?: string;
}

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "github"
  | "youtube"
  | "website";

export type LinkStatus = "pending" | "approved" | "rejected";

export interface SocialLink {
  id: string;
  userId: string;
  platform: SocialPlatform;
  url: string;
  status: LinkStatus;
  /** Trust score bonus granted by the admin (1, 2, or 3). */
  bonus: number;
  createdAt: string; // ISO
  reviewedAt?: string; // ISO
}

export interface Message {
  id: string;
  requestId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string; // ISO
}

export type ReportType = "item" | "user" | "transaction" | "platform" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  type: ReportType;
  subject: string;
  description: string;
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
  reviewedAt?: string;
  targetItemId?: string;
  targetUserId?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  /** Router view to open when clicked, e.g. { view: "dashboard" }. */
  link?: { view: string; params?: Record<string, string> };
}

export type ViewName =
  | "landing"
  | "login"
  | "register"
  | "browse"
  | "view-item"
  | "borrow-flow"
  | "dashboard"
  | "add-item"
  | "edit-item"
  | "notifications"
  | "profile"
  | "chat"
  | "messages"
  | "admin-dashboard"
  | "admin-users"
  | "admin-verify"
  | "admin-social"
  | "admin-reports"
  | "admin-flagged"
  | "report"
  | "view-profile"
  | "not-found";

export interface RouterState {
  view: ViewName;
  params: Record<string, string>;
}
