import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/app/database/generated/client.js";
import { envConfig } from "../src/configs/env.config.js";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: envConfig.dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminUsername = process.env.SUPER_ADMIN_USERNAME;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error("SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD must be set in environment");
  }

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      fullname: "Super Admin",
      username: adminUsername,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  console.log("Seeded admin:", { id: admin.id, username: admin.username });

  // ── Rooms ─────────────────────────────────────────────────────────────────
  const existingRooms = await prisma.room.findMany({ where: { deletedAt: null } });
  const existingRoomNames = new Set(existingRooms.map((r) => r.name));
  const roomsToCreate = Array.from({ length: 6 }, (_, i) => `Ruang ${i + 1}`).filter(
    (name) => !existingRoomNames.has(name)
  );
  if (roomsToCreate.length > 0) {
    await prisma.room.createMany({ data: roomsToCreate.map((name) => ({ name, capacity: 25 })) });
  }
  const allRooms = await prisma.room.findMany({ where: { deletedAt: null } });
  console.log("Seeded rooms:", allRooms.map((r) => r.name));

  // ── Supervisors ──────────────────────────────────────────────────────────
  const supervisorData = [
    { fullname: "Andi Setiawan",  username: "pengawas01" },
    { fullname: "Bambang Irawan", username: "pengawas02" },
    { fullname: "Christina Dewi", username: "pengawas03" },
    { fullname: "Dwi Prastyo",    username: "pengawas04" },
  ];
  const supervisorPassword = await bcrypt.hash("pengawas123", 10);
  for (const s of supervisorData) {
    await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: { fullname: s.fullname, username: s.username, passwordHash: supervisorPassword, role: "SUPERVISOR" },
    });
  }
  console.log("Seeded supervisors:", supervisorData.map((s) => s.username));

  // ── Participants ──────────────────────────────────────────────────────────
  const participantData = [
    { fullname: "Ahmad Fauzi",     username: "peserta01" },
    { fullname: "Budi Raharjo",    username: "peserta02" },
    { fullname: "Citra Sari",      username: "peserta03" },
    { fullname: "Dedi Kurniawan",  username: "peserta04" },
    { fullname: "Eka Purwanto",    username: "peserta05" },
    { fullname: "Fajar Nugroho",   username: "peserta06" },
    { fullname: "Gita Lestari",    username: "peserta07" },
    { fullname: "Hana Pertiwi",    username: "peserta08" },
    { fullname: "Irwan Santoso",   username: "peserta09" },
    { fullname: "Juwita Dewi",     username: "peserta10" },
  ];
  const participantPassword = await bcrypt.hash("peserta123", 10);
  for (const p of participantData) {
    await prisma.user.upsert({
      where: { username: p.username },
      update: {},
      create: { fullname: p.fullname, username: p.username, passwordHash: participantPassword, role: "PARTICIPANT" },
    });
  }
  console.log("Seeded participants:", participantData.map((p) => p.username));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
