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

async function checkSchema() {
  await client.connect();
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log("Tables:", tables.rows.map(r => r.table_name));
  
  for (const table of tables.rows) {
    const columns = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table.table_name}'`);
    console.log(`Columns for ${table.table_name}:`, columns.rows.map(c => `${c.column_name} (${c.data_type})`));
  }
  
  await client.end();
}

checkSchema().catch(console.error);
