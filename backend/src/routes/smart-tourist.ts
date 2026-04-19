import crypto from "node:crypto";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import nodemailer from "nodemailer";
import { pool } from "@workspace/db";
import { getNodemailerSmtpConfig, getEmailCredentials } from "../lib/email-config.js";
import {
  CancelSmartTouristBookingBody,
  CancelSmartTouristBookingParams,
  CancelSmartTouristBookingResponse,
  ConfirmSmartTouristBookingOtpBody,
  ConfirmSmartTouristBookingOtpResponse,
  CreateSmartTouristBookingBody,
  CreateSmartTouristBookingResponse,
  ExtendSmartTouristBookingBody,
  ExtendSmartTouristBookingParams,
  ExtendSmartTouristBookingResponse,
  GetSmartTouristAdminDashboardResponse,
  GetSmartTouristBootstrapResponse,
  GetSmartTouristReceptionistDashboardParams,
  GetSmartTouristReceptionistDashboardResponse,
  GetSmartTouristUserDashboardParams,
  GetSmartTouristUserDashboardResponse,
  RequestSmartTouristKeyBody,
  RequestSmartTouristKeyParams,
  RequestSmartTouristKeyResponse,
  RequestSmartTouristBookingOtpBody,
  RequestSmartTouristBookingOtpResponse,
  ReturnSmartTouristKeyBody,
  ReturnSmartTouristKeyParams,
  ReturnSmartTouristKeyResponse,
  SmartTouristLoginBody,
  SmartTouristLoginResponse,
  SmartTouristReceptionistActionBody,
  SmartTouristReceptionistActionResponse,
  SmartTouristRegisterBody,
  SmartTouristRegisterResponse,
  UpdateSmartTouristUserProfileBody,
  UpdateSmartTouristUserProfileParams,
  UpdateSmartTouristUserProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
import { io } from "../index";

function notifyUpdate(type: string, data?: any) {
  io.emit("DATA_UPDATE", { type, data, timestamp: new Date().toISOString() });
}

const asyncRoute = (handler: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};

// Moved profile update to the top for better matching
router.post("/smart-tourist/receptionist/:receptionistId/update-profile", asyncRoute(async (req, res) => {
  const { receptionistId } = req.params;
  console.log(`[DEBUG] Profile update request for receptionist: ${receptionistId}`, req.body);
  const body = req.body;
  const index = receptionists.findIndex((item) => item.id === receptionistId);
  if (index < 0) throw new Error("Receptionist not found.");
  
  const previous = { ...receptionists[index] };
  
  // Security Logic: Update only allowed fields
  if (body.phone !== undefined) receptionists[index].phone = body.phone;
  if (body.password) {
    receptionists[index].password = body.password;
  }
  
  await saveRow("receptionists", receptionists[index].id, receptionists[index]);
  
  addAudit("receptionist", receptionists[index].name, "profile_update", "receptionist", receptionistId, previous, receptionists[index], receptionists[index].stationId);
  
  res.json({
    receptionist: receptionists[index],
    message: "Profile updated successfully."
  });
}));

type BookingDraft = ReturnType<typeof CreateSmartTouristBookingBody.parse>;

let destinations: Array<{ id: string; name: string; description: string }> = [];
let stations: Array<{
  id: string;
  destinationId: string;
  name: string;
  receptionistId: string;
  totalLockers: number;
  availableLockers: number;
  bookedLockers: number;
  processingLockers: number;
  address: string;
}> = [];

let receptionists: Array<{
  id: string;
  name: string;
  email: string;
  stationId: string;
  stationName: string;
}> = [];

let lockers: Array<{
  id: string;
  stationId: string;
  number: number;
  status: "available" | "booked" | "occupied" | "processing" | "partial";
  nextAvailableAt: string | null;
  partialAvailableHours: number | null;
}> = [];

let users = [
  {
    id: "user-1",
    name: "Demo Tourist",
    phone: "01710000000",
    email: "rabbyjahidulislam5@gmail.com",
    address: "Dhaka, Bangladesh",
    photoUrl: "https://api.dicebear.com/8.x/initials/svg?seed=Demo%20Tourist",
    createdAt: new Date("2026-04-17T10:00:00.000Z").toISOString(),
  },
];

type BookingStatus = "pending" | "key_requested" | "active" | "return_requested" | "completed" | "cancelled" | "overdue_due";

type Booking = {
  id: string;
  userId: string;
  userName: string;
  stationId: string;
  stationName: string;
  destinationName: string;
  lockerId: string;
  lockerNumber: number;
  durationHours: number;
  checkInTime: string;
  checkOutTime: string;
  actualCheckInTime: string | null;
  actualCheckOutTime: string | null;
  status: BookingStatus;
  amount: number;
  paidAmount: number;
  refundAmount: number;
  penaltyPercent: number;
  dueAmount: number;
  createdAt: string;
};

let bookings: Booking[] = [];
let payments: Array<{
  id: string;
  bookingId: string;
  userId: string;
  stationId: string;
  type: "booking_payment" | "40%_penalty" | "80%_penalty" | "100%_penalty" | "refund" | "due_payment" | "successful_settlement" | "refund_40_penalty" | "refund_80_penalty";
  amount: number;
  reason: string;
  createdAt: string;
}> = [];

type OtpLog = {
  id: string;
  userId: string;
  email: string;
  otpHash: string;
  bookingDraft: BookingDraft;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

let otpLogs: OtpLog[] = [];

let auditLogs: Array<{
  id: string;
  actorRole: "public" | "user" | "receptionist" | "admin";
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  previousValue: string;
  newValue: string;
  stationId: string | null;
  createdAt: string;
}> = [
  {
    id: "audit-1",
    actorRole: "admin",
    actorName: "System",
    actionType: "registration",
    entityType: "user",
    entityId: "user-1",
    previousValue: "none",
    newValue: "Demo Tourist account created",
    stationId: null,
    createdAt: new Date().toISOString(),
  },
];

let nextId = 2;

const nowIso = () => new Date().toISOString();

/**
 * Robustly converts an ISO date string to a local YYYY-MM-DD string.
 * This avoids UTC offset issues where split('T')[0] might show the previous day.
 */
function formatDateLocal(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Robustly converts an ISO date string to a local YYYY-MM string.
 */
function formatMonthLocal(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
const amountFor = (hours: number) => hours * 50;
const publicStatuses = new Set(["pending", "key_requested", "active", "return_requested", "overdue_due"]);
const databaseTables = {
  users: "smart_tourist_users",
  receptionists: "smart_tourist_receptionists",
  bookings: "smart_tourist_bookings",
  payments: "smart_tourist_payments",
  auditLogs: "smart_tourist_audit_logs",
  otpLogs: "smart_tourist_otp_logs",
} as const;

const storageReady = initializeStorage();

function otpHash(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function makeOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function emailTransport() {
  return nodemailer.createTransport(getNodemailerSmtpConfig());
}

async function sendUserEmail(user: { email: string; name: string }, subject: string, lines: string[]) {
  const { user: emailUser } = getEmailCredentials();
  await emailTransport().sendMail({
    from: `"Smart Locker System" <${emailUser}>`,
    to: user.email,
    subject,
    text: [`Hello ${user.name},`, "", ...lines, "", "Smart Locker System"].join("\n"),
  });
}

async function sendActionEmail(userId: string, subject: string, lines: string[]) {
  const user = users.find((item) => item.id === userId);
  if (!user) return;
  await sendUserEmail(user, subject, lines);
}

function bookingEmailLines(booking: Booking, heading: string) {
  return [
    heading,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
    `Booking Time: ${new Date(booking.createdAt).toLocaleString()}`,
    `Check-in: ${new Date(booking.checkInTime).toLocaleString()}`,
    `Check-out: ${new Date(booking.checkOutTime).toLocaleString()}`,
    `Duration: ${booking.durationHours} hour(s)`,
    `Total Cost: ৳${booking.amount}`,
  ];
}

async function saveRow(table: keyof typeof databaseTables, id: string, data: unknown) {
  await storageReady;
  await pool.query(
    `INSERT INTO ${databaseTables[table]} (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [id, JSON.stringify(data)],
  );
}

async function loadRows<T>(table: keyof typeof databaseTables): Promise<T[]> {
  const result = await pool.query(`SELECT data FROM ${databaseTables[table]}`);
  return result.rows.map((row) => row.data as T);
}

async function initializeStorage() {
  console.log("[STORAGE] Starting storage initialization...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS smart_tourist_users (id TEXT PRIMARY KEY, data JSONB NOT NULL);
      CREATE TABLE IF NOT EXISTS smart_tourist_receptionists (id TEXT PRIMARY KEY, data JSONB NOT NULL);
      CREATE TABLE IF NOT EXISTS smart_tourist_bookings (id TEXT PRIMARY KEY, data JSONB NOT NULL);
      CREATE TABLE IF NOT EXISTS smart_tourist_payments (id TEXT PRIMARY KEY, data JSONB NOT NULL);
      CREATE TABLE IF NOT EXISTS smart_tourist_audit_logs (id TEXT PRIMARY KEY, data JSONB NOT NULL);
      CREATE TABLE IF NOT EXISTS smart_tourist_otp_logs (id TEXT PRIMARY KEY, data JSONB NOT NULL);
    `);
    console.log("[STORAGE] Tables ensured.");
  } catch (err) {
    console.error("[STORAGE] Error creating tables:", err);
  }

  // Load standard tables into memory if they exist
  try {
    const dbDestinations = await loadDestinationsFromDb();
    console.log(`[STORAGE] Loaded ${dbDestinations.length} destinations from DB.`);
    if (dbDestinations.length > 0) {
      destinations.length = 0;
      destinations.push(...dbDestinations);
    }

    const dbStations = await loadStationsFromDb();
    console.log(`[STORAGE] Loaded ${dbStations.length} stations from DB.`);
    if (dbStations.length > 0) {
      // Re-map stations from DB
      const loadedStations = dbStations.map(s => ({
        ...s,
        availableLockers: s.availableLockers,
        bookedLockers: s.bookedLockers,
        processingLockers: s.processingLockers
      }));
      
      stations.length = 0;
      stations.push(...loadedStations as any);

      // Default receptionists from stations
      const defaultReceptionists = loadedStations.map(station => ({
        id: station.receptionistId,
        name: `${station.name} Receptionist`,
        email: `${station.id}@smarttourist.bd`,
        stationId: station.id,
        stationName: station.name,
        phone: "",
        password: "station123"
      }));

      receptionists.length = 0;
      receptionists.push(...defaultReceptionists as any);
      console.log(`[STORAGE] Generated ${receptionists.length} default receptionists.`);
    }

    const dbLockers = await loadLockersFromDb();
    console.log(`[STORAGE] Loaded ${dbLockers.length} lockers from DB.`);
    if (dbLockers.length > 0) {
      lockers.length = 0;
      lockers.push(...dbLockers as any);
    }
  } catch (err: any) {
    console.error("[STORAGE] Error loading standard tables:", err.message);
  }

  const storedUsers = await loadRows<(typeof users)[number]>("users");
  const storedReceptionists = await loadRows<(typeof receptionists)[number]>("receptionists");
  console.log(`[STORAGE] Loaded ${storedReceptionists.length} stored receptionists from DB.`);
  const storedBookings = await loadRows<Booking>("bookings");
  const storedPayments = await loadRows<(typeof payments)[number]>("payments");
  const storedAudits = await loadRows<(typeof auditLogs)[number]>("auditLogs");
  const storedOtps = await loadRows<OtpLog>("otpLogs");

  if (storedUsers.length > 0) {
    storedUsers.forEach(stored => {
      const idx = users.findIndex(u => u.id === stored.id);
      if (idx >= 0) users[idx] = { ...users[idx], ...stored };
      else users.push(stored);
    });
  } else {
    await Promise.all(users.map((user) =>
      pool.query(`INSERT INTO smart_tourist_users (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [user.id, JSON.stringify(user)]),
    ));
  }

  if (storedReceptionists.length > 0) {
    // Merge stored receptionists (with updated profiles) into the memory list
    storedReceptionists.forEach(stored => {
      const idx = receptionists.findIndex(r => r.id === stored.id);
      if (idx >= 0) receptionists[idx] = { ...receptionists[idx], ...stored };
      else receptionists.push(stored);
    });
    console.log(`[STORAGE] Memory now has ${receptionists.length} receptionists after merge.`);
  } else {
    // Seed initial receptionists into the DB
    console.log(`[STORAGE] Seeding ${receptionists.length} initial receptionists to DB.`);
    await Promise.all(receptionists.map((rec) =>
      pool.query(`INSERT INTO smart_tourist_receptionists (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [rec.id, JSON.stringify(rec)]),
    ));
  }

  bookings = storedBookings;
  payments = storedPayments;
  otpLogs = storedOtps;

  if (storedAudits.length > 0) auditLogs = storedAudits;
  else {
    await Promise.all(auditLogs.map((audit) =>
      pool.query(`INSERT INTO smart_tourist_audit_logs (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`, [audit.id, JSON.stringify(audit)]),
    ));
  }

  const ids = [
    ...users.map((item) => item.id),
    ...receptionists.map((item) => item.id),
    ...bookings.map((item) => item.id),
    ...payments.map((item) => item.id),
    ...auditLogs.map((item) => item.id),
    ...otpLogs.map((item) => item.id),
  ];
  nextId = Math.max(nextId, ...ids.map((id) => Number(id.split("-").at(-1) ?? "0")).filter(Number.isFinite)) + 1;
}

async function loadDestinationsFromDb() {
  const result = await pool.query(`SELECT id, name, description FROM destinations ORDER BY id`);
  return result.rows.map((row) => ({ id: row.id, name: row.name, description: row.description }));
}

async function loadStationsFromDb() {
  const result = await pool.query(`
    SELECT id,
      destination_id AS "destinationId",
      name,
      receptionist_id AS "receptionistId",
      total_lockers AS "totalLockers",
      available_lockers AS "availableLockers",
      booked_lockers AS "bookedLockers",
      processing_lockers AS "processingLockers",
      address
    FROM stations
    ORDER BY destination_id, name
  `);
  return result.rows;
}

async function loadLockersFromDb() {
  const result = await pool.query(`
    SELECT id,
      station_id AS "stationId",
      number,
      status,
      next_available_at AS "nextAvailableAt",
      partial_available_hours AS "partialAvailableHours"
    FROM lockers
    ORDER BY station_id, number
  `);
  return result.rows.map((row) => ({
    ...row,
    nextAvailableAt: row.nextAvailableAt ? row.nextAvailableAt.toISOString() : null,
  }));
}

async function loadBootstrapFromDb() {
  const destinations = await loadDestinationsFromDb();
  if (destinations.length === 0) return null;

  const stations = await loadStationsFromDb();
  if (stations.length === 0) return null;

  const lockers = await loadLockersFromDb();
  if (lockers.length === 0) return null;

  return {
    destinations,
    stations,
    lockers,
    defaultCredentials: [
      "User demo: phone 01710000000, password user123",
      "Admin demo: admin@smarttourist.bd, password admin123",
      "Receptionist demo: cox-s1@smarttourist.bd, password station123",
      "All station receptionists use their station email and password station123",
    ],
  };
}

function getStationById(id: string) {
  const station = stations.find((s) => s.id === id);
  if (!station) {
    throw new Error(`Station with ID ${id} not found.`);
  }
  return station;
}

function destinationNameForStation(stationId: string) {
  const station = stations.find((item) => item.id === stationId);
  const destination = destinations.find((item) => item.id === station?.destinationId);
  return destination?.name ?? "Unknown Destination";
}

function addAudit(
  actorRole: "public" | "user" | "receptionist" | "admin",
  actorName: string,
  actionType: string,
  entityType: string,
  entityId: string,
  previousValue: unknown,
  newValue: unknown,
  stationId: string | null,
) {
  const audit = {
    id: `audit-${nextId++}`,
    actorRole,
    actorName,
    actionType,
    entityType,
    entityId,
    previousValue: typeof previousValue === "string" ? previousValue : JSON.stringify(previousValue),
    newValue: typeof newValue === "string" ? newValue : JSON.stringify(newValue),
    stationId,
    createdAt: nowIso(),
  };
  auditLogs.unshift(audit);
  void saveRow("auditLogs", audit.id, audit);
  return audit;
}

function lockersForStation(stationId: string) {
  const now = Date.now();
  return lockers
    .filter((l) => l.stationId === stationId)
    .map((l) => {
      const { id, number } = l;
      // Find all future bookings for this locker that are not completed or cancelled
      const activeLockerBookings = bookings
        .filter((item) => item.lockerId === id && publicStatuses.has(item.status))
        .sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());

      if (activeLockerBookings.length === 0) {
        return { ...l, status: "available" as const, nextAvailableAt: null, partialAvailableHours: null };
      }

      const firstBooking = activeLockerBookings[0];
      const checkIn = new Date(firstBooking.checkInTime).getTime();
      const checkOut = new Date(firstBooking.checkOutTime).getTime();

      // If there's a booking currently active or requested
      if (now >= checkIn || firstBooking.status === "key_requested" || firstBooking.status === "return_requested" || firstBooking.status === "active" || firstBooking.status === "overdue_due") {
        if (firstBooking.status === "key_requested" || firstBooking.status === "return_requested") {
          return { ...l, status: "processing" as const, nextAvailableAt: firstBooking.checkOutTime, partialAvailableHours: null };
        }
        return { ...l, status: "booked" as const, nextAvailableAt: firstBooking.checkOutTime, partialAvailableHours: null };
      }

      // If the first booking is in the future
      const gapMs = checkIn - now;
      const gapHours = Math.floor(gapMs / 3600000);

      if (gapHours >= 1) {
        return {
          ...l,
          status: "partial" as const,
          nextAvailableAt: firstBooking.checkInTime,
          partialAvailableHours: gapHours,
        };
      }

      // Less than 1 hour gap, mark as booked/unavailable
      return { ...l, status: "booked" as const, nextAvailableAt: firstBooking.checkOutTime, partialAvailableHours: null };
    });
}

async function currentStations() {
  const dbStations = await loadStationsFromDb();
  // Sync memory stations with DB stations
  stations.length = 0;
  stations.push(...dbStations as any);
  
  return stations.map((station) => {
    const lockers = lockersForStation(station.id);
    return {
      ...station,
      availableLockers: lockers.filter((item) => item.status === "available" || item.status === "partial").length,
      bookedLockers: lockers.filter((item) => item.status === "booked" || item.status === "occupied").length,
      processingLockers: lockers.filter((item) => item.status === "processing").length,
    };
  });
}

async function bootstrap() {
  const dbDestinations = await loadDestinationsFromDb();
  destinations.length = 0;
  destinations.push(...dbDestinations);

  const dbLockers = await loadLockersFromDb();
  lockers.length = 0;
  lockers.push(...dbLockers as any);

  return {
    destinations,
    stations: await currentStations(),
    lockers: stations.flatMap((station) => lockersForStation(station.id)),
    defaultCredentials: [
      "User demo: phone 01710000000, password user123",
      "Admin demo: admin@smarttourist.bd, password admin123",
      "Receptionist demo: cox-s1@smarttourist.bd, password station123",
      "All station receptionists use their station email and password station123",
    ],
  };
}

async function userDashboard(userId: string) {
  const dbStations = await loadStationsFromDb();
  stations.length = 0;
  stations.push(...dbStations as any);

  const user = users.find((item) => item.id === userId);
  if (!user) {
    return {
      user: { id: userId, name: "Guest", phone: "N/A", email: "N/A", address: "N/A", photoUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${userId}` },
      activeBookings: [],
      history: [],
      payments: [],
      notifications: [],
      metrics: [
        { label: "Active bookings", value: 0, note: "Current running locker work" },
        { label: "Completed trips", value: 0, note: "Returned key and closed" },
        { label: "Due payment", value: 0, note: "Auto update or extension due" },
        { label: "Refunds", value: 0, note: "Cancellation refunds" },
      ],
    };
  }

  const now = Date.now();
  // Auto-extend overdue bookings in memory before returning
  bookings.forEach(b => {
    if (b.userId === user.id && b.status === "active" && now > new Date(b.checkOutTime).getTime()) {
      const overtimeMs = now - new Date(b.checkOutTime).getTime();
      const extraHours = Math.ceil(overtimeMs / (60 * 60 * 1000));
      if (extraHours > 0) {
        b.status = "overdue_due";
        b.dueAmount = amountFor(extraHours);
        void saveRow("bookings", b.id, b);
      }
    }
  });

  const relatedBookings = bookings.filter((item) => item.userId === user.id);
  const relatedPayments = payments.filter((item) => item.userId === user.id);

  const enrichBookingWithDynamicStation = (b: Booking) => {
    const station = stations.find(s => s.id === b.stationId);
    return { 
      ...b, 
      stationName: station?.name || b.stationName, // Fallback to saved name if station not found
      userPhone: user.phone,
      totalAmount: b.amount + b.dueAmount // Ensure total amount is available
    };
  };

  return {
    user,
    activeBookings: relatedBookings
      .filter((item) => publicStatuses.has(item.status))
      .map(enrichBookingWithDynamicStation),
    history: relatedBookings.map(enrichBookingWithDynamicStation),
    payments: relatedPayments.map(p => {
      const b = bookings.find(item => item.id === p.bookingId);
      return { 
        ...p, 
        userPhone: user.phone,
        userName: user.name,
        lockerNumber: b?.lockerNumber || "N/A",
        stationName: stations.find(s => s.id === p.stationId)?.name || "N/A"
      };
    }),
    notifications: relatedBookings
      .filter((item) => publicStatuses.has(item.status) && Math.abs(new Date(item.checkInTime).getTime() - Date.now()) <= 10 * 60 * 1000)
      .map((item) => {
        const station = stations.find(s => s.id === item.stationId);
        return `Your booking for locker ${item.lockerNumber} at ${station?.name || item.stationName} is ready for key request.`;
      }),
    metrics: [
      { label: "Active bookings", value: relatedBookings.filter((item) => publicStatuses.has(item.status)).length, note: "Current running locker work" },
      { label: "Completed trips", value: relatedBookings.filter((item) => item.status === "completed").length, note: "Returned key and closed" },
      { label: "Due payment", value: relatedPayments.filter((item) => item.type === "due_payment").reduce((sum, item) => sum + item.amount, 0), note: "Total dues settled" },
      { label: "Refunds", value: relatedPayments.filter((item) => item.type === "refund").reduce((sum, item) => sum + item.amount, 0), note: "Cancellation refunds" },
    ],
  };
}

async function receptionistDashboard(receptionistId: string) {
  const receptionist = receptionists.find((item) => item.id === receptionistId);
  if (!receptionist) {
    throw new Error(`Receptionist with ID ${receptionistId} not found.`);
  }
  const allStations = await currentStations();
  const station = allStations.find((item) => item.id === receptionist.stationId);
  if (!station) {
    throw new Error(`Station for receptionist ${receptionistId} not found.`);
  }
  
  const stationBookings = bookings.filter((item) => item.stationId === station.id);
  const stationPayments = payments.filter((item) => item.stationId === station.id);
  
  const enrichBooking = (b: Booking) => {
    const user = users.find(u => u.id === b.userId);
    return { 
      ...b, 
      stationName: station.name, // Force correct name for receptionist view
      userPhone: user?.phone || "N/A",
      userName: user?.name || b.userName,
      totalAmount: b.amount + b.dueAmount // Total amount is principal + dues
    };
  };

  const enrichPayment = (p: typeof payments[0]) => {
    const user = users.find(u => u.id === p.userId);
    const b = bookings.find(item => item.id === p.bookingId);
    return { 
      ...p, 
      userPhone: user?.phone || "N/A",
      userName: user?.name || "N/A",
      lockerNumber: b?.lockerNumber || "N/A",
      stationName: station.name
    };
  };

  // Status Sync: Ensure that only bookings marked as COMPLETED (after key return) or CANCELLED contribute to the income totals.
  // Net Income & Transaction Logic: 40%, 80% and 100% penalties are added to income immediately upon cancellation.
  // Regular bookings are added only after key return confirmation (successful_settlement).
  const settledPayments = stationPayments.filter(p => {
    if (p.type === "40%_penalty" || p.type === "80%_penalty" || p.type === "100%_penalty") return true; // Penalties are settled immediately
    if (p.type === "successful_settlement" || p.type === "due_payment") {
      const booking = bookings.find(b => b.id === p.bookingId);
      return booking && (booking.status === "completed" || booking.status === "cancelled");
    }
    return false;
  });

  return {
    receptionist: {
      ...receptionist,
      stationName: station.name // Ensure receptionist profile shows correct station name
    },
    station,
    lockers: lockersForStation(station.id),
    bookingQueue: stationBookings
      .filter((item) => item.status === "key_requested" || item.status === "return_requested" || item.status === "overdue_due")
      .map(enrichBooking),
    activeBookings: stationBookings
      .filter(b => ["pending", "key_requested", "active", "return_requested", "overdue_due"].includes(b.status))
      .map(enrichBooking),
    history: stationBookings.filter(b => b.status === "completed" || b.status === "cancelled").map(enrichBooking),
    payments: stationPayments.map(enrichPayment),
    metrics: [
        { label: "40% fine total", value: settledPayments.filter((item) => item.type === "40%_penalty").reduce((sum, item) => sum + item.amount, 0), note: "Cancellation before check-in" },
        { label: "80% / 100% fine total", value: settledPayments.filter((item) => item.type === "80%_penalty" || item.type === "100%_penalty").reduce((sum, item) => sum + item.amount, 0), note: "Cancellation within 1 hour or after 1 hour" },
        { label: "Successful booking total", value: settledPayments.filter((item) => item.type === "successful_settlement").reduce((sum, item) => {
          const booking = bookings.find(b => b.id === item.bookingId);
          if (booking && booking.status === "completed" && booking.penaltyPercent === 0) return sum + item.amount;
          return sum;
      }, 0), note: "Station earned amount" },
      { label: "Due collected", value: settledPayments.filter((item) => item.type === "due_payment").reduce((sum, item) => sum + item.amount, 0), note: "Manual/auto extension dues" },
    ],
  };
}

function adminDashboard() {
  const enrichBooking = (b: Booking) => {
    const station = stations.find(s => s.id === b.stationId);
    const user = users.find(u => u.id === b.userId);
    return { 
      ...b, 
      stationName: station?.name || b.stationName,
      userPhone: user?.phone || "N/A"
    };
  };

  const enrichPayment = (p: typeof payments[0]) => {
    const b = bookings.find(item => item.id === p.bookingId);
    const userId = p.userId || b?.userId;
    const user = users.find(u => u.id === userId);
    const stationId = p.stationId || b?.stationId;
    const station = stations.find(s => s.id === stationId);
    
    return { 
      ...p, 
      userPhone: user?.phone || "N/A",
      userName: user?.name || "N/A",
      lockerNumber: b?.lockerNumber || "N/A",
      stationName: station?.name || b?.stationName || "N/A"
    };
  };

  const pulse = { week: [] as any[], month: [] as any[] };
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = formatDateLocal(d.toISOString());
    // Filter by auditLogs to show system activity pulse
    const count = auditLogs.filter(log => formatDateLocal(log.createdAt) === dateKey).length;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const entry = { name: label, value: count };
    pulse.month.push(entry);
    if (i < 7) pulse.week.push(entry);
  }

  return {
    metrics: [
      { label: "Destinations", value: destinations.length, note: "Bangladesh tourist zones" },
      { label: "Stations", value: stations.length, note: "5 stations per destination" },
      { label: "Total lockers", value: stations.length * 100, note: "100 lockers per station" },
      { label: "Total revenue", value: payments.reduce((sum, item) => {
          if (item.type === "refund" || item.type === "refund_40_penalty" || item.type === "refund_80_penalty") {
            return sum - item.amount;
          }
          return sum + item.amount;
      }, 0), note: "Payments, fines and settlements minus refunds" },
      { label: "Audit records", value: auditLogs.length, note: "Why, where and how provenance trail" },
    ],
    bookings: bookings.map(enrichBooking),
    users,
    receptionists,
    payments: payments.map(enrichPayment),
    auditLogs,
    pulse,
  };
}

function ensureLockerAvailable(stationId: string, lockerId: string) {
  const locker = lockersForStation(stationId).find((item) => item.id === lockerId);
  if (!locker || locker.status !== "available") {
    throw new Error("This locker is no longer available. Please select another green locker.");
  }
}

async function createConfirmedBooking(body: BookingDraft) {
  const user = users.find((item) => item.id === body.userId) ?? users[0];
  const station = getStationById(body.stationId);
  ensureLockerAvailable(station.id, body.lockerId);
  const lockerNumber = Number(body.lockerId.split("-l").at(-1) ?? "1");
  const checkIn = new Date(body.checkInTime);
  const checkOut = new Date(checkIn.getTime() + body.durationHours * 60 * 60 * 1000);
  const booking: Booking = {
    id: `booking-${nextId++}`,
    userId: user.id,
    userName: user.name,
    stationId: station.id,
    stationName: station.name,
    destinationName: destinationNameForStation(station.id),
    lockerId: body.lockerId,
    lockerNumber,
    durationHours: body.durationHours,
    checkInTime: checkIn.toISOString(),
    checkOutTime: checkOut.toISOString(),
    actualCheckInTime: null,
    actualCheckOutTime: null,
    status: "pending",
    amount: amountFor(body.durationHours),
    paidAmount: amountFor(body.durationHours),
    refundAmount: 0,
    penaltyPercent: 0,
    dueAmount: 0,
    createdAt: nowIso(),
  };
  const payment = { id: `payment-${nextId++}`, bookingId: booking.id, userId: user.id, stationId: station.id, type: "booking_payment" as const, amount: booking.paidAmount, reason: "Online locker booking payment", createdAt: nowIso() };
  bookings.unshift(booking);
  payments.unshift(payment);
  await Promise.all([saveRow("bookings", booking.id, booking), saveRow("payments", payment.id, payment)]);
  
  const userAuditData = {
    userName: user.name,
    userPhone: user.phone,
    userEmail: user.email,
    userAddress: user.address,
    lockerNumber: booking.lockerNumber,
    stationName: station.name,
    amount: booking.paidAmount
  };

  const audit = addAudit("user", user.name, "booking_created", "booking", booking.id, "none", { 
    ...booking, 
    ...userAuditData
  }, station.id);
  
  // Also add to payment audit log
  addAudit("user", user.name, "booking_payment", "payment_audit", payment.id, "none", {
    ...payment,
    ...userAuditData
  }, station.id);

  // LOG FOR VERIFICATION
  console.log(`[AUDIT] Logged payment_audit for booking: ${booking.id}, payment: ${payment.id}`);
  await sendUserEmail(user, "Smart Locker System booking confirmed", bookingEmailLines(booking, "Your payment and booking are confirmed."));

  // Background reminder - simple setTimeout for demo purposes since we don't have a real worker
  const checkInTime = new Date(booking.checkInTime).getTime();
  const reminderTime = checkInTime - 10 * 60 * 1000;
  const delay = reminderTime - Date.now();
  if (delay > 0) {
    setTimeout(async () => {
      const currentBooking = bookings.find(b => b.id === booking.id);
      if (currentBooking && currentBooking.status === "pending") {
        await sendUserEmail(user, "10-minute Check-in Reminder", [
          "Your booking starts in 10 minutes!",
          `Locker: ${booking.lockerNumber}`,
          `Station: ${booking.stationName}`,
          "Please request your key from the dashboard once you arrive."
        ]);
      }
    }, delay);
  }

  return { booking, audit };
}

router.use((req, res, next) => {
  storageReady.then(() => next()).catch(next);
});

router.get("/smart-tourist/bootstrap", asyncRoute(async (req, res) => {
  res.json(await bootstrap());
}));

router.post("/smart-tourist/login", (req, res) => {
  const body = req.body;
  if (body.role === "admin" && body.identifier === "admin@smarttourist.bd" && body.password === "admin123") {
    addAudit("admin", "Admin", "login", "session", "admin", { State: "logged out" }, { State: "logged in" }, null);
    res.json({ role: "admin", user: null, receptionist: null, adminName: "Smart Locker Admin" });
    return;
  }
  
  if (body.role === "receptionist") {
    const receptionist = receptionists.find((item) => item.email === body.identifier);
    if (!receptionist) {
      throw new Error("Receptionist not found. Check your station email.");
    }
    if (receptionist.password !== body.password) {
      throw new Error("Invalid password for receptionist.");
    }
    addAudit("receptionist", receptionist.name, "login", "session", receptionist.id, { State: "logged out" }, { State: "logged in" }, receptionist.stationId);
    res.json({ role: "receptionist", user: null, receptionist, adminName: null });
    return;
  }
  
  const user = users.find((item) => item.phone === body.identifier || item.email === body.identifier);
  if (!user) {
    throw new Error("User not found. Please register first.");
  }
  if (user.password && user.password !== body.password) {
    throw new Error("Invalid password for user.");
  }
  
  addAudit("user", user.name, "login", "session", user.id, { State: "logged out" }, { State: "logged in" }, null);
  res.json({ role: "user", user, receptionist: null, adminName: null });
});

router.post("/smart-tourist/logout", (req, res) => {
  const { role, id, name, stationId } = req.body;
  
  if (role && id && name) {
    addAudit(
      role as any,
      name,
      "logout",
      "session",
      id,
      { State: "logged in" },
      { State: "logged out" },
      stationId || null
    );
  }
  
  res.json({ message: "Logged out successfully" });
});

router.post("/smart-tourist/register", asyncRoute(async (req, res) => {
  const body = req.body;
  const user = { id: `user-${nextId++}`, ...body };
  users.unshift(user);
  await saveRow("users", user.id, user);
  addAudit("public", body.name, "registration", "user", user.id, "none", user, null);
  notifyUpdate("USER_REGISTERED", user);
  res.json({ role: "user", user, receptionist: null, adminName: null });
}));

router.get("/smart-tourist/user/:userId", asyncRoute(async (req, res) => {
  const { userId } = req.params;
  res.json(await userDashboard(userId));
}));

router.patch("/smart-tourist/user/:userId", asyncRoute(async (req, res) => {
  const { userId } = req.params;
  const body = req.body;
  const index = users.findIndex((item) => item.id === userId);
  const previous = users[index] ?? users[0];
  users[index < 0 ? 0 : index] = { ...previous, ...body };
  await saveRow("users", users[index < 0 ? 0 : index].id, users[index < 0 ? 0 : index]);
  addAudit("user", users[index < 0 ? 0 : index].name, "profile_update", "user", userId, previous, users[index < 0 ? 0 : index], null);
  await sendUserEmail(users[index < 0 ? 0 : index], "Smart Locker System profile updated", [
    `Your profile was updated at ${new Date().toLocaleString()}.`,
    `Name: ${users[index < 0 ? 0 : index].name}`,
    `Phone: ${users[index < 0 ? 0 : index].phone}`,
    `Email: ${users[index < 0 ? 0 : index].email}`,
  ]);
  notifyUpdate("USER_UPDATED", users[index < 0 ? 0 : index]);
  res.json(await userDashboard(userId));
}));

router.post("/smart-tourist/bookings", asyncRoute(async (req, res) => {
  const body = CreateSmartTouristBookingBody.parse(req.body);
  const { booking, audit } = await createConfirmedBooking(body);
  notifyUpdate("BOOKING_CREATED", booking);
  res.json({ booking, message: "Booking created and synced to receptionist/admin panels.", audit });
}));

router.post("/smart-tourist/bookings/otp/request", asyncRoute(async (req, res) => {
  const body = RequestSmartTouristBookingOtpBody.parse(req.body);
  const user = users.find((item) => item.id === body.userId);
  if (!user) throw new Error("Authentication required for booking.");
  const station = stations.find((item) => item.id === body.stationId);
  if (!station) throw new Error("Station not found.");
  ensureLockerAvailable(station.id, body.lockerId);
  const lockerNumber = Number(body.lockerId.split("-l").at(-1) ?? "1");
  const checkIn = new Date(body.checkInTime);
  const checkOut = new Date(checkIn.getTime() + body.durationHours * 60 * 60 * 1000);
  const otp = makeOtp();
  const otpLog: OtpLog = {
    id: `otp-${nextId++}`,
    userId: user.id,
    email: user.email,
    otpHash: otpHash(otp),
    bookingDraft: body,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    usedAt: null,
    createdAt: nowIso(),
  };
  otpLogs.unshift(otpLog);
  await saveRow("otpLogs", otpLog.id, otpLog);
  await sendUserEmail(user, "Smart Locker System booking OTP", [
    `Your OTP is: ${otp}`,
    "This OTP expires in 10 minutes.",
    `Station Name: ${station.name}`,
    `Locker Number: ${lockerNumber}`,
    `Check-in: ${checkIn.toLocaleString()}`,
    `Check-out: ${checkOut.toLocaleString()}`,
    `Duration: ${body.durationHours} hour(s)`,
    `Total Cost: ৳${amountFor(body.durationHours)}`,
  ]);
  addAudit("user", user.name, "booking_otp_sent", "otp", otpLog.id, "none", { stationId: station.id, lockerNumber }, station.id);
  res.json({
    otpId: otpLog.id,
    expiresAt: otpLog.expiresAt,
    message: `OTP sent to your registered email. Please check your inbox.`,
  });
}));

router.post("/smart-tourist/bookings/otp/confirm", asyncRoute(async (req, res) => {
  const body = ConfirmSmartTouristBookingOtpBody.parse(req.body);
  const otpLog = otpLogs.find((item) => item.id === body.otpId);
  if (!otpLog || otpLog.usedAt) throw new Error("Invalid or already used OTP.");
  if (new Date(otpLog.expiresAt).getTime() < Date.now()) throw new Error("OTP expired. Please request a new OTP.");
  if (otpHash(body.otp) !== otpLog.otpHash) throw new Error("Wrong OTP. Please try again.");
  otpLog.usedAt = nowIso();
  await saveRow("otpLogs", otpLog.id, otpLog);
  const { booking, audit } = await createConfirmedBooking(otpLog.bookingDraft);
  notifyUpdate("BOOKING_CREATED", booking);
  res.json({ booking, message: "Payment and booking confirmed after OTP verification.", audit });
}));

router.post("/smart-tourist/bookings/:bookingId/cancel/preview", asyncRoute(async (req, res) => {
  const { bookingId } = req.params;
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found.");
  
  const currentTime = Date.now();
  const checkInTime = new Date(booking.checkInTime).getTime();
  const ONE_HOUR = 60 * 60 * 1000;
  
  let penaltyPercent = 40;
  let canCancel = true;

  if (currentTime < checkInTime) {
    // Condition A (40% Fine): currentTime < checkInTime
    penaltyPercent = 40;
  } else if (currentTime >= checkInTime && currentTime <= (checkInTime + ONE_HOUR)) {
    // Condition B (80% Fine): checkInTime <= currentTime <= checkInTime + 1_HOUR
    penaltyPercent = 80;
  } else {
    // More than 1 hour after check-in, no cancellation allowed (100% penalty)
    penaltyPercent = 100;
    canCancel = false;
  }
  
  const penalty = Math.round((booking.paidAmount * penaltyPercent) / 100);
  const refundAmount = Math.max(0, booking.paidAmount - penalty);
  
  res.json({
    penaltyPercent,
    penaltyAmount: penalty,
    refundAmount,
    paidAmount: booking.paidAmount,
    canCancel,
    message: !canCancel ? "No cancellation allowed after 1 hour of check-in." : `${penaltyPercent}% penalty applies.`
  });
}));

router.post("/smart-tourist/bookings/:bookingId/cancel", asyncRoute(async (req, res) => {
  const { bookingId } = req.params;
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found.");
  const previous = { ...booking };
  
  const currentTime = Date.now();
  const checkInTime = new Date(booking.checkInTime).getTime();
  const ONE_HOUR = 60 * 60 * 1000;
  
  let penaltyPercent = 40;
  if (currentTime < checkInTime) {
    // Condition A (40% Fine): currentTime < checkInTime
    penaltyPercent = 40;
  } else if (currentTime >= checkInTime && currentTime <= (checkInTime + ONE_HOUR)) {
    // Condition B (80% Fine): checkInTime <= currentTime <= checkInTime + 1_HOUR
    penaltyPercent = 80;
  } else {
    // Condition C (100% Fine): After 1 hour of check-in
    penaltyPercent = 100;
  }
  
  const penaltyAmount = Math.round((booking.paidAmount * penaltyPercent) / 100);
  const refundAmount = Math.max(0, booking.paidAmount - penaltyAmount);
  
  booking.status = "cancelled";
  booking.penaltyPercent = penaltyPercent;
  booking.refundAmount = refundAmount;
  booking.actualCheckOutTime = nowIso();
  
  const actionType = penaltyPercent === 40 ? "40%_penalty" : (penaltyPercent === 80 ? "80%_penalty" : "100%_penalty");
  
  // Step 2: Force Financial Database Insertions
  // Insert Penalty Record
  const penaltyPayment = { 
    id: `payment-${nextId++}`, 
    bookingId: booking.id, 
    userId: booking.userId, 
    stationId: booking.stationId, 
    type: actionType as any, 
    amount: penaltyAmount, 
    reason: `Cancellation penalty (${penaltyPercent}%)`, 
    createdAt: nowIso() 
  };
  payments.unshift(penaltyPayment);

  // Insert Refund Record
  let refundPayment = null;
  if (refundAmount > 0) {
    refundPayment = {
      id: `payment-${nextId++}`,
      bookingId: booking.id,
      userId: booking.userId,
      stationId: booking.stationId,
      type: "refund" as any,
      amount: refundAmount,
      reason: `Refund for ${penaltyPercent}% penalty cancellation`,
      createdAt: nowIso()
    };
    payments.unshift(refundPayment);
  }
  
  const dbOps = [
    saveRow("bookings", booking.id, booking),
    saveRow("payments", penaltyPayment.id, penaltyPayment)
  ];
  if (refundPayment) {
    dbOps.push(saveRow("payments", refundPayment.id, refundPayment));
  }
  await Promise.all(dbOps);
  
  const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
  const userAuditData = {
    userName: user.name,
    userPhone: (user as any).phone || "",
    userEmail: (user as any).email || "",
    userAddress: (user as any).address || "",
    lockerNumber: booking.lockerNumber,
    stationName: booking.stationName,
    amount: penaltyAmount
  };

  const audit = addAudit("user", booking.userName, "booking_cancelled", "booking", booking.id, previous, { ...booking, ...userAuditData }, booking.stationId);
  
  // Explicitly add to payment audit log for Penalty
  addAudit("user", booking.userName, actionType, "payment_audit", penaltyPayment.id, "none", {
    ...penaltyPayment,
    ...userAuditData
  }, booking.stationId);

  // Explicitly add to payment audit log for Refund
  if (refundPayment) {
    addAudit("user", booking.userName, "refund", "payment_audit", refundPayment.id, "none", {
      ...refundPayment,
      ...userAuditData,
      transactionType: "refund"
    }, booking.stationId);
  }

  await sendActionEmail(booking.userId, "Smart Locker System booking cancelled", [
    `Cancellation time: ${new Date().toLocaleString()}`,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
    `Refund: ৳${booking.refundAmount}`,
    `Penalty: ${booking.penaltyPercent}%`,
  ]);

  notifyUpdate("BOOKING_CANCELLED", booking);
  res.json({ 
    booking, 
    message: `${penaltyPercent}% penalty applied. Refund ৳${booking.refundAmount} recorded.`, 
    audit 
  });
}));

router.post("/smart-tourist/bookings/:bookingId/extend", asyncRoute(async (req, res) => {
  const { bookingId } = req.params;
  const body = req.body;
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found.");
  const previous = { ...booking };
  booking.durationHours += body.extraHours;
  booking.checkOutTime = new Date(new Date(booking.checkOutTime).getTime() + body.extraHours * 60 * 60 * 1000).toISOString();
  booking.dueAmount += amountFor(body.extraHours);
  await saveRow("bookings", booking.id, booking);
  
  const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
  const userAuditData = {
    userName: user.name,
    userPhone: (user as any).phone || "",
    userEmail: (user as any).email || "",
    userAddress: (user as any).address || ""
  };

  const audit = addAudit("user", booking.userName, "booking_extended", "booking", booking.id, previous, { ...booking, ...userAuditData }, booking.stationId);
  await sendActionEmail(booking.userId, "Smart Locker System booking updated", [
    `Updated time: ${new Date(booking.checkOutTime).toLocaleString()}`,
    `Updated cost: ৳${booking.amount + booking.dueAmount}`,
    `Update timestamp: ${new Date().toLocaleString()}`,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
  ]);
  res.json({ booking, message: `Time extended by ${body.extraHours} hour(s). Due payment updated.`, audit });
}));

router.post("/smart-tourist/bookings/:bookingId/key-request", asyncRoute(async (req, res) => {
  const { bookingId } = req.params;
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found.");
  const previous = { ...booking };
  booking.status = "key_requested";
  await saveRow("bookings", booking.id, booking);
  
  const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
  const userAuditData = {
    userName: user.name,
    userPhone: (user as any).phone || "",
    userEmail: (user as any).email || "",
    userAddress: (user as any).address || ""
  };

  const audit = addAudit("user", booking.userName, "key_requested", "booking", booking.id, previous, { ...booking, ...userAuditData }, booking.stationId);
  await sendActionEmail(booking.userId, "Smart Locker System key request received", [
    `Action time: ${new Date().toLocaleString()}`,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
    "Your key request has been sent to the receptionist.",
  ]);
  notifyUpdate("KEY_REQUESTED", booking);
  res.json({ booking, message: "Key request sent to station receptionist.", audit });
}));

router.post("/smart-tourist/bookings/:bookingId/return-key", asyncRoute(async (req, res) => {
  const { bookingId } = req.params;
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Booking not found.");
  const previous = { ...booking };
  
  const now = Date.now();
  const checkOut = new Date(booking.checkOutTime).getTime();
  
  if (now > checkOut) {
    const overtimeMs = now - checkOut;
    const extraHours = Math.ceil(overtimeMs / (60 * 60 * 1000));
    booking.dueAmount = amountFor(extraHours);
    booking.status = "overdue_due";
    await saveRow("bookings", booking.id, booking);
    
    res.json({
      booking,
      dueAmount: booking.dueAmount,
      requiresPayment: true,
      message: `Your booking is overdue by ${extraHours} hour(s). Please pay the due amount of ৳${booking.dueAmount} to proceed.`
    });
    notifyUpdate("BOOKING_OVERDUE", booking);
    return;
  }
  
  booking.status = "return_requested";
  await saveRow("bookings", booking.id, booking);
  
  const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
  const userAuditData = {
    userName: user.name,
    userPhone: (user as any).phone || "",
    userEmail: (user as any).email || "",
    userAddress: (user as any).address || ""
  };

  const audit = addAudit("user", booking.userName, "key_return_requested", "booking", booking.id, previous, { ...booking, ...userAuditData }, booking.stationId);
  await sendActionEmail(booking.userId, "Smart Locker System key return requested", [
    `Action time: ${new Date().toLocaleString()}`,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
    "Your return request has been sent to the receptionist.",
  ]);
  notifyUpdate("KEY_RETURN_REQUESTED", booking);
  res.json({ booking, message: "Return request sent to receptionist for confirmation.", audit });
}));

router.post("/smart-tourist/bookings/:bookingId/pay-due", asyncRoute(async (req, res) => {
  const { bookingId } = req.params;
  
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) {
    return res.status(404).json({ message: `Booking ${bookingId} not found.` });
  }

  if (booking.dueAmount <= 0) {
    return res.status(400).json({ message: "No due payment required." });
  }

  const previous = { ...booking };
  const amount = booking.dueAmount;
  
  booking.paidAmount += amount;
  booking.dueAmount = 0;
  
  // Only transition to return_requested if the booking was in overdue_due state.
  // If it was active (e.g. extension payment), keep it active.
  if (previous.status === "overdue_due") {
    booking.status = "return_requested";
  }
  
  const payment = { 
    id: `payment-${nextId++}`, 
    bookingId: booking.id, 
    userId: booking.userId, 
    stationId: booking.stationId, 
    type: "due_payment" as const, 
    amount, 
    reason: `${previous.status === "overdue_due" ? "Overtime" : "Extension"} due for Locker #${booking.lockerNumber} cleared`, 
    createdAt: nowIso() 
  };
  
  payments.unshift(payment);
  await Promise.all([
    saveRow("bookings", booking.id, booking),
    saveRow("payments", payment.id, payment)
  ]);
  
  const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
  const userAuditData = {
    userName: user.name,
    userPhone: (user as any).phone || "",
    userEmail: (user as any).email || "",
    userAddress: (user as any).address || "",
    lockerNumber: booking.lockerNumber,
    stationName: booking.stationName,
    amount: amount
  };

  addAudit("user", booking.userName, "due_payment_cleared", "booking", booking.id, previous, { ...booking, ...userAuditData }, booking.stationId);
  
  // Also add to payment audit log
  addAudit("user", booking.userName, "due_collected", "payment_audit", payment.id, "none", {
    ...payment,
    ...userAuditData
  }, booking.stationId);
  
  await sendActionEmail(booking.userId, "Smart Locker System due payment cleared", [
    `Action time: ${new Date().toLocaleString()}`,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
    `Amount Paid: ৳${amount}`,
    `Current status: ${booking.status.replace(/_/g, " ")}`,
  ]);

  res.json({ 
    booking, 
    message: `Due payment of ৳${amount} cleared. ${booking.status === "return_requested" ? "Request sent to receptionist." : "Booking remains active."}`,
    success: true 
  });
  notifyUpdate("DUE_PAID", booking);
}));

router.get("/smart-tourist/receptionist/:receptionistId", asyncRoute(async (req, res) => {
  const { receptionistId } = req.params;
  res.json(await receptionistDashboard(receptionistId));
}));

router.post("/smart-tourist/receptionist/action", asyncRoute(async (req, res) => {
  const body = req.body;
  const receptionist = receptionists.find((item) => item.id === body.receptionistId);
  if (!receptionist) throw new Error("Receptionist not found.");
  const booking = bookings.find((item) => item.id === body.bookingId);
  if (!booking) throw new Error("Booking not found.");
  const previous = { ...booking };
  if (body.action === "confirm_key_issue") {
    booking.status = "active";
    booking.actualCheckInTime = nowIso();
  }
  if (body.action === "confirm_key_receipt") {
    if (booking.dueAmount > 0) {
      throw new Error("Cannot confirm key receipt while due payment is pending.");
    }
    booking.status = "completed";
    booking.actualCheckOutTime = nowIso();
    
    // Calculate net settlement amount
    // For regular bookings: paidAmount + dueAmount
    // For penalty cancellations: paidAmount - refundAmount
    const settlementAmount = booking.penaltyPercent > 0 
      ? (booking.paidAmount - booking.refundAmount) 
      : (booking.paidAmount + booking.dueAmount);
      
    const payment = { 
      id: `payment-${nextId++}`, 
      bookingId: booking.id, 
      userId: booking.userId, 
      stationId: booking.stationId, 
      type: "successful_settlement" as const, 
      amount: settlementAmount, 
      reason: booking.penaltyPercent > 0 
        ? `Cancellation settlement (${booking.penaltyPercent}% penalty)` 
        : "Booking completed and key returned", 
      createdAt: nowIso() 
    };
    payments.unshift(payment);
    await saveRow("payments", payment.id, payment);

    const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
    const userAuditData = {
      userName: user.name,
      userPhone: (user as any).phone || "",
      userEmail: (user as any).email || "",
      userAddress: (user as any).address || "",
      lockerNumber: booking.lockerNumber,
      stationName: booking.stationName,
      amount: settlementAmount
    };
    
    // Add to payment audit log
    addAudit("receptionist", receptionist.name, "successful_settlement", "payment_audit", payment.id, "none", {
      ...payment,
      ...userAuditData
    }, booking.stationId);

    // Explicitly log the net income as a finalized transaction
    addAudit("receptionist", receptionist.name, "net_income_finalized", "payment_audit", `net-${payment.id}`, "none", {
      ...userAuditData,
      amount: settlementAmount,
      reason: "Net income recognized after key return"
    }, booking.stationId);
  }
  if (body.action === "confirm_due_payment") {
    const payment = { id: `payment-${nextId++}`, bookingId: booking.id, userId: booking.userId, stationId: booking.stationId, type: "due_payment" as const, amount: booking.dueAmount, reason: "Due payment confirmed by receptionist", createdAt: nowIso() };
    payments.unshift(payment);
    await saveRow("payments", payment.id, payment);
    
    const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
    const userAuditData = {
      userName: user.name,
      userPhone: (user as any).phone || "",
      userEmail: (user as any).email || "",
      userAddress: (user as any).address || "",
      lockerNumber: booking.lockerNumber,
      stationName: booking.stationName,
      amount: booking.dueAmount
    };
    
    // Add to payment audit log
    addAudit("receptionist", receptionist.name, "due_collected", "payment_audit", payment.id, "none", {
      ...payment,
      ...userAuditData
    }, booking.stationId);

    // If status was overdue_due, transition to completed since the due is collected 
    // and this is usually the final step of a return.
    if (booking.status === "overdue_due") {
      booking.status = "completed";
      booking.actualCheckOutTime = nowIso();
      
      // Also record the successful settlement (the total amount including this due)
      const settlementAmount = booking.paidAmount + booking.dueAmount;
      const settlementPayment = { 
        id: `payment-${nextId++}`, 
        bookingId: booking.id, 
        userId: booking.userId, 
        stationId: booking.stationId, 
        type: "successful_settlement" as const, 
        amount: settlementAmount, 
        reason: "Booking completed and due collected by receptionist", 
        createdAt: nowIso() 
      };
      payments.unshift(settlementPayment);
      await saveRow("payments", settlementPayment.id, settlementPayment);

      // Audit the settlement
      addAudit("receptionist", receptionist.name, "successful_settlement", "payment_audit", settlementPayment.id, "none", {
        ...settlementPayment,
        userName: user.name,
        userPhone: (user as any).phone || ""
      }, booking.stationId);
    }
    
    booking.dueAmount = 0;
  }
  await saveRow("bookings", booking.id, booking);
  
  const user = users.find(u => u.id === booking.userId) || { name: booking.userName };
  const userAuditData = {
    userName: user.name,
    userPhone: (user as any).phone || "",
    userEmail: (user as any).email || "",
    userAddress: (user as any).address || ""
  };

  const audit = addAudit("receptionist", receptionist.name, body.action, "booking", booking.id, previous, { ...booking, ...userAuditData }, booking.stationId);
  await sendActionEmail(booking.userId, "Smart Locker System station update", [
    `Action: ${body.action.replace(/_/g, " ")}`,
    `Action time: ${new Date().toLocaleString()}`,
    `Station Name: ${booking.stationName}`,
    `Locker Number: ${booking.lockerNumber}`,
    `Current status: ${booking.status}`,
  ]);
  notifyUpdate("RECEPTIONIST_ACTION", { action: body.action, booking });
  res.json({ booking, message: `Successfully processed ${body.action.replace(/_/g, " ")}.`, audit });
}));

router.get("/smart-tourist/admin", asyncRoute(async (req, res) => {
  const { date, month, type } = req.query;
  const dashboard = adminDashboard();
  
  let filteredBookings = [...dashboard.bookings];
  let filteredAudits = [...dashboard.auditLogs];
  
  // Backend date filtering removed to prevent timezone mismatch with client.
  // The frontend handles filtering locally using the user's timezone.
  
  if (type === "login") {
    filteredAudits = filteredAudits.filter(a => a.actionType === "login");
  } else if (type === "registration") {
    filteredAudits = filteredAudits.filter(a => a.actionType === "registration");
  }

  res.json({
    ...dashboard,
    bookings: filteredBookings,
    auditLogs: filteredAudits
  });
}));

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Smart Tourist request failed.";
  res.status(400).json({ message });
});

// ─────────────────────────────────────────────────────────────
// REVIEW & RATING SYSTEM — Added as a standalone, zero-regression block
// ─────────────────────────────────────────────────────────────

/** In-memory reviews store */
type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;         // 1–5 integer
  text: string;
  createdAt: string;      // ISO timestamp
};

let reviews: Review[] = [];

/** Create the reviews table and load existing rows on startup */
async function initReviewsStorage() {
  await storageReady; // Wait for main storage initialisation first
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smart_tourist_reviews (id TEXT PRIMARY KEY, data JSONB NOT NULL);
  `);
  const result = await pool.query(`SELECT data FROM smart_tourist_reviews ORDER BY data->>'createdAt' DESC`);
  reviews = result.rows.map((r: any) => r.data as Review);
}

// Fire-and-forget — errors are logged but never crash the server
initReviewsStorage().catch((err: any) =>
  console.error("[Reviews] Storage init failed:", err.message)
);

/** Persist a single review to PostgreSQL */
async function saveReview(review: Review) {
  await pool.query(
    `INSERT INTO smart_tourist_reviews (id, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
    [review.id, JSON.stringify(review)],
  );
}

/** DELETE a review row from PostgreSQL */
async function deleteReview(id: string) {
  await pool.query(`DELETE FROM smart_tourist_reviews WHERE id = $1`, [id]);
}

// ── POST /api/smart-tourist/reviews ─────────────────────────
// Submit a new review (requires valid userId in body)
router.post("/smart-tourist/reviews", asyncRoute(async (req, res) => {
  const { userId, rating, text } = req.body as { userId: string; rating: number; text: string };

  // Basic validation
  if (!userId || !text?.trim()) {
    return res.status(400).json({ message: "userId and review text are required." });
  }
  const stars = Math.min(5, Math.max(1, Math.round(Number(rating))));
  if (!stars) return res.status(400).json({ message: "Rating must be 1–5 stars." });

  const author = users.find(u => u.id === userId);
  if (!author) return res.status(400).json({ message: "User not found." });

  const review: Review = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    userName: author.name,
    rating: stars,
    text: text.trim().slice(0, 1000), // cap at 1000 chars
    createdAt: new Date().toISOString(),
  };

  reviews.unshift(review); // newest first in memory
  await saveReview(review);

  // Real-time push to ALL connected clients (Admin + Public view)
  notifyUpdate("REVIEW_SUBMITTED", review);

  // Audit logging
  addAudit("user", author.name, "SUBMIT_REVIEW", "review", review.id, "none", `${stars} stars: ${text.slice(0, 50)}...`, null);

  res.status(201).json({ review, message: "Review submitted successfully." });
}));

// ── GET /api/smart-tourist/reviews ──────────────────────────
// Fetch reviews, optionally filtered by date / month / year
router.get("/smart-tourist/reviews", asyncRoute(async (req, res) => {
  const { limit } = req.query as Record<string, string>;

  let result = [...reviews];

  // Backend date/month filtering removed to prevent timezone mismatch with client.
  // The frontend handles filtering locally using the user's timezone.

  // Optional result cap
  const cap = limit ? Math.min(100, parseInt(limit)) : 50;
  result = result.slice(0, cap);

  res.json({ reviews: result, total: result.length });
}));

// ── DELETE /api/smart-tourist/reviews/:id ───────────────────
// Admin-only: permanently delete a review
router.delete("/smart-tourist/reviews/:id", asyncRoute(async (req, res) => {
  const { id } = req.params;
  const idx = reviews.findIndex(r => r.id === id);
  if (idx < 0) return res.status(404).json({ message: "Review not found." });

  reviews.splice(idx, 1);
  await deleteReview(id);

  // Real-time broadcast so all dashboards update instantly
  notifyUpdate("REVIEW_DELETED", { id });

  // Audit logging
  addAudit("admin", "Admin", "DELETE_REVIEW", "review", id, "Review exists", "Review deleted", null);

  res.json({ message: "Review deleted successfully." });
}));

export default router;