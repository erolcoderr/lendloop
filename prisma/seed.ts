/**
 * LendLoop database seed script.
 *
 * Creates ONE admin account so the system is usable from a fresh database.
 * No sample items, users, or notifications — the database starts clean.
 *
 * Run:  bun run db:seed
 * (after `bun run db:push` has created the tables)
 *
 * Idempotent: wipes existing rows first so re-running gives a clean state.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LendLoop database...");

  // Wipe everything in dependency order (children first).
  console.log("  · clearing existing data");
  await db.report.deleteMany();
  await db.message.deleteMany();
  await db.socialLink.deleteMany();
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.borrowRequest.deleteMany();
  await db.item.deleteMany();
  await db.user.deleteMany();

  // Create ONE admin account so new registrations can be approved.
  // Without an admin, the verification system creates a deadlock.
  console.log("  · inserting 1 admin account");
  await db.user.create({
    data: {
      id: "u_admin",
      name: "Barangay Admin",
      email: "admin@lendloop.ph",
      password: hashPassword("admin123"),
      avatar: "https://i.pravatar.cc/150?img=12",
      barangay: "Barangay Mabini",
      city: "Quezon City",
      role: "admin",
      status: "active",
      verified: true,
      verificationStatus: "approved" as any,
      joinedAt: new Date(),
      bio: "Barangay admin and LendLoop community steward.",
    },
  });

  const counts = {
    users: await db.user.count(),
    items: await db.item.count(),
    requests: await db.borrowRequest.count(),
    reviews: await db.review.count(),
    notifications: await db.notification.count(),
  };
  console.log("\n✅ Seed complete. Row counts:");
  console.table(counts);
  console.log("\n📋 Admin login:");
  console.log("   Email:    admin@lendloop.ph");
  console.log("   Password: admin123");
  console.log("\n💡 Register new member accounts via the Register page.");
  console.log("   New accounts require admin approval before login.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
