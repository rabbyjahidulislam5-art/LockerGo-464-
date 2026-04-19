import fs from "node:fs";
import path from "node:path";
import pg from "pg";

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        if (idx === -1) return [line, ""];
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        return [key, value];
      }),
  );
}

const env = parseDotEnv(path.resolve(process.cwd(), ".env"));
const connectionString = process.env.DATABASE_URL || env.DATABASE_URL || "postgresql://postgres:password123@localhost:5432/smart_tourist_db";

const client = new pg.Client({ connectionString });

const destinations = [
  { id: "cox", name: "Cox’s Bazar", description: "Beach station network for sea-side day trips." },
  { id: "sylhet", name: "Sylhet", description: "Tea garden and shrine visitor locker support." },
  { id: "bandarban", name: "Bandarban", description: "Hill-track travel lockers for trekking visitors." },
  { id: "khagrachari", name: "Khagrachari", description: "Tourist station lockers around hill destinations." },
  { id: "rangamati", name: "Rangamati", description: "Lake and hill visitor baggage safety points." },
];

const stationNames = {
  cox: ["Laboni Beach", "Sugandha Point", "Inani", "Kolatoli", "Marine Drive"],
  sylhet: ["Shahjalal Dargah", "Jaflong", "Ratargul", "Bholaganj", "Malnicherra"],
  bandarban: ["Nilgiri", "Nilachal", "Thanchi", "Meghla", "Chimbuk"],
  khagrachari: ["Sajek Valley", "Alutila Cave", "Risang Waterfall", "Horticulture Park", "Dighinala"],
  rangamati: ["Kaptai Lake", "Hanging Bridge", "Shuvolong Falls", "Rajbari", "Polwel Park"],
};

const stations = destinations.flatMap((destination) =>
  stationNames[destination.id].map((name, index) => {
    const id = `${destination.id}-s${index + 1}`;
    return {
      id,
      destinationId: destination.id,
      name,
      receptionistId: `rec-${id}`,
      totalLockers: 100,
      availableLockers: 100,
      bookedLockers: 0,
      processingLockers: 0,
      address: `${name}, ${destination.name}`,
    };
  }),
);

const lockers = stations.flatMap((station) =>
  Array.from({ length: 100 }, (_, index) => ({
    id: `${station.id}-l${index + 1}`,
    stationId: station.id,
    number: index + 1,
    status: "available",
    nextAvailableAt: null,
    partialAvailableHours: null,
  })),
);

async function main() {
  await client.connect();
  console.log("Connected to PostgreSQL for seeding.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS destinations (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS stations (
      id VARCHAR(255) PRIMARY KEY,
      destination_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      receptionist_id VARCHAR(255) NOT NULL,
      total_lockers INTEGER NOT NULL,
      available_lockers INTEGER NOT NULL,
      booked_lockers INTEGER NOT NULL,
      processing_lockers INTEGER NOT NULL,
      address TEXT,
      FOREIGN KEY(destination_id) REFERENCES destinations(id)
    );

    CREATE TABLE IF NOT EXISTS lockers (
      id VARCHAR(255) PRIMARY KEY,
      station_id VARCHAR(255) NOT NULL,
      number INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL,
      next_available_at TIMESTAMP NULL,
      partial_available_hours INTEGER NULL,
      FOREIGN KEY(station_id) REFERENCES stations(id)
    );
  `);

  console.log("Destination, station, and locker tables are ready.");

  await client.query("BEGIN");

  for (const destination of destinations) {
    await client.query(
      `INSERT INTO destinations (id, name, description) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
      [destination.id, destination.name, destination.description],
    );
  }

  for (const station of stations) {
    await client.query(
      `INSERT INTO stations (id, destination_id, name, receptionist_id, total_lockers, available_lockers, booked_lockers, processing_lockers, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         destination_id = EXCLUDED.destination_id,
         receptionist_id = EXCLUDED.receptionist_id,
         total_lockers = EXCLUDED.total_lockers,
         available_lockers = EXCLUDED.available_lockers,
         booked_lockers = EXCLUDED.booked_lockers,
         processing_lockers = EXCLUDED.processing_lockers,
         address = EXCLUDED.address;`,
      [
        station.id,
        station.destinationId,
        station.name,
        station.receptionistId,
        station.totalLockers,
        station.availableLockers,
        station.bookedLockers,
        station.processingLockers,
        station.address,
      ],
    );
  }

  for (const locker of lockers) {
    await client.query(
      `INSERT INTO lockers (id, station_id, number, status, next_available_at, partial_available_hours)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET station_id = EXCLUDED.station_id, number = EXCLUDED.number, status = EXCLUDED.status, next_available_at = EXCLUDED.next_available_at, partial_available_hours = EXCLUDED.partial_available_hours;`,
      [locker.id, locker.stationId, locker.number, locker.status, locker.nextAvailableAt, locker.partialAvailableHours],
    );
  }

  await client.query("COMMIT");
  console.log(`Seeded ${destinations.length} destinations, ${stations.length} stations, ${lockers.length} lockers.`);
}

main()
  .then(() => {
    console.log("Database seeding complete.");
    return client.end();
  })
  .catch((error) => {
    console.error("Failed to seed database:", error);
    client.end().catch(() => null);
    process.exit(1);
  });
