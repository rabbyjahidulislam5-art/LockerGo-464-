import pg from 'pg';
const connectionString = 'postgresql://neondb_owner:npg_RIVjhPZkm4z7@ep-billowing-night-am2t9gd7-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const client = new pg.Client({ connectionString });

async function seed() {
  await client.connect();
  console.log('Connected to Neon');
  
  await client.query("INSERT INTO destinations (id, name, description) VALUES ('cox', 'Cox’s Bazar', 'Beach station network') ON CONFLICT (id) DO NOTHING");
  await client.query("INSERT INTO stations (id, destination_id, name, receptionist_id, total_lockers, available_lockers, booked_lockers, processing_lockers, address) VALUES ('cox-s1', 'cox', 'Laboni Beach', 'rec-1', 100, 100, 0, 0, 'Cox’s Bazar') ON CONFLICT (id) DO NOTHING");
  
  console.log('Basic data seeded successfully');
  await client.end();
}

seed().catch(console.error);
