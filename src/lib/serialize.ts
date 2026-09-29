import type {
  User,
  Item,
  BorrowRequest,
  Review,
  AppNotification,
  SocialLink,
  Message,
} from "./types";

/**
 * Serializers: convert Prisma rows (Date objects, Json columns, enums) into the
 * plain-JSON shape the client expects (matching types.ts). Keeps API responses
 * consistent with the existing mock-data format so views barely change.
 */

export function serializeUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: "", // never sent to client
    avatar: u.avatar,
    barangay: u.barangay,
    city: u.city,
    role: u.role,
    status: u.status,
    verified: u.verified,
    joinedAt: u.joinedAt instanceof Date ? u.joinedAt.toISOString() : String(u.joinedAt),
    bio: u.bio ?? undefined,
    phone: u.phone ?? undefined,
    // Verification fields (faceImage/idImage excluded for privacy unless
    // explicitly requested by an admin endpoint).
    verificationStatus: u.verificationStatus ?? "unverified",
    faceImage: undefined,
    idImage: undefined,
    verificationSubmittedAt: u.verificationSubmittedAt instanceof Date ? u.verificationSubmittedAt.toISOString() : undefined,
    verificationReviewedAt: u.verificationReviewedAt instanceof Date ? u.verificationReviewedAt.toISOString() : undefined,
    verificationNote: u.verificationNote ?? undefined,
  };
}

export function serializeItem(it: any): Item {
  return {
    id: it.id,
    title: it.title,
    description: it.description,
    category: it.category,
    condition: it.condition,
    images: Array.isArray(it.images) ? it.images : [],
    primaryImageIndex: it.primaryImageIndex ?? 0,
    ownerId: it.ownerId,
    maxBorrowDays: it.maxBorrowDays,
    deposit: it.deposit,
    bookedDates: Array.isArray(it.bookedDates) ? it.bookedDates : [],
    status: it.status,
    location: it.location,
    createdAt: it.createdAt instanceof Date ? it.createdAt.toISOString() : String(it.createdAt),
    views: it.views ?? 0,
  };
}

export function serializeRequest(r: any): BorrowRequest {
  return {
    id: r.id,
    itemId: r.itemId,
    borrowerId: r.borrowerId,
    ownerId: r.ownerId,
    startDate: r.startDate instanceof Date ? r.startDate.toISOString().slice(0, 10) : String(r.startDate),
    endDate: r.endDate instanceof Date ? r.endDate.toISOString().slice(0, 10) : String(r.endDate),
    message: r.message,
    status: r.status,
    agreementSigned: r.agreementSigned,
    signatureName: r.signatureName,
    agreementText: r.agreementText ?? undefined,
    wantsCopy: r.wantsCopy ?? false,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    borrowedAt: r.borrowedAt ? (r.borrowedAt instanceof Date ? r.borrowedAt.toISOString() : String(r.borrowedAt)) : undefined,
    returnedAt: r.returnedAt ? (r.returnedAt instanceof Date ? r.returnedAt.toISOString() : String(r.returnedAt)) : undefined,
  };
}

export function serializeReview(rv: any): Review {
  return {
    id: rv.id,
    fromUserId: rv.fromUserId,
    toUserId: rv.toUserId,
    itemId: rv.itemId,
    requestId: rv.requestId ?? undefined,
    rating: rv.rating,
    comment: rv.comment,
    createdAt: rv.createdAt instanceof Date ? rv.createdAt.toISOString() : String(rv.createdAt),
  };
}

export function serializeNotification(n: any): AppNotification {
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
    link: n.link ?? undefined,
  };
}

export function serializeSocialLink(sl: any): SocialLink {
  return {
    id: sl.id,
    userId: sl.userId,
    platform: sl.platform,
    url: sl.url,
    status: sl.status,
    bonus: sl.bonus ?? 1,
    createdAt: sl.createdAt instanceof Date ? sl.createdAt.toISOString() : String(sl.createdAt),
    reviewedAt:
      sl.reviewedAt instanceof Date
        ? sl.reviewedAt.toISOString()
        : sl.reviewedAt
          ? String(sl.reviewedAt)
          : undefined,
  };
}

export function serializeMessage(m: any): Message {
  return {
    id: m.id,
    requestId: m.requestId,
    senderId: m.senderId,
    content: m.content,
    read: !!m.read,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
  };
}
