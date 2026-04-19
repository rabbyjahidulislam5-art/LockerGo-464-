import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

function parseDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#")).map(line => {
      const idx = line.indexOf("=");
      return idx === -1 ? [line, ""] : [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
  );
}

const env = parseDotEnv(path.resolve(process.cwd(), ".env"));
const connectionString = env.DATABASE_URL;
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

async function seed() {
  await client.connect();
  console.log("Connected to Neon for fast seeding...");

  await client.query("BEGIN");

  // Clear existing to avoid conflicts
  await client.query("DELETE FROM lockers");
  await client.query("DELETE FROM stations");
  await client.query("DELETE FROM destinations");

  // Insert Destinations
  for (const d of destinations) {
    await client.query("INSERT INTO destinations (id, name, description) VALUES ($1, $2, $3)", [d.id, d.name, d.description]);
  }
  console.log("Destinations seeded.");

  // Insert Stations
  for (const dId of Object.keys(stationNames)) {
    for (const [idx, name] of stationNames[dId].entries()) {
      const id = `${dId}-s${idx + 1}`;
      await client.query(
        "INSERT INTO stations (id, destination_id, name, receptionist_id, total_lockers, available_lockers, booked_lockers, processing_lockers, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [id, dId, name, `rec-${id}`, 100, 100, 0, 0, `${name}, ${destinations.find(d => d.id === dId).name}`]
      );
    }
  }
  console.log("Stations seeded.");

  // Batch Insert Lockers (Highly optimized)
  const stationIds = Object.keys(stationNames).flatMap(dId => stationNames[dId].map((_, idx) => `${dId}-s${idx + 1}`));
  
  for (const sId of stationIds) {
    const lockerValues = [];
    const lockerParams = [];
    for (let i = 1; i <= 100; i++) {
      const baseIdx = (i - 1) * 4;
      lockerValues.push(`($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4})`);
      lockerParams.push(`${sId}-l${i}`, sId, i, 'available');
    }
    await client.query(
      `INSERT INTO lockers (id, station_id, number, status) VALUES ${lockerValues.join(",")}`,
      lockerParams
    );
  }
  
  await client.query("COMMIT");
  console.log("All data seeded successfully!");
  await client.end();
}

seed().catch(async err => {
  console.error(err);
  await client.query("ROLLBACK");
  client.end();
});
