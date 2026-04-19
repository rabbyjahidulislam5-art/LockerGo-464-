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

async function seedReceptionists() {
  await client.connect();
  console.log("Connected to Neon to seed receptionists...");

  const stationsRes = await client.query('SELECT id, name, receptionist_id FROM stations');
  const stations = stationsRes.rows;

  console.log(`Found ${stations.length} stations. Generating receptionists...`);

  for (const station of stations) {
    const receptionist = {
      id: station.receptionist_id,
      name: `${station.name} Receptionist`,
      email: `${station.id}@smarttourist.bd`,
      stationId: station.id,
      stationName: station.name,
      phone: "",
      password: "station123"
    };

    await client.query(
      `INSERT INTO smart_tourist_receptionists (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [receptionist.id, JSON.stringify(receptionist)]
    );
  }

  console.log("All 25 receptionists seeded successfully!");
  await client.end();
}

seedReceptionists().catch(console.error);
