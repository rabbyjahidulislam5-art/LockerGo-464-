const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:password123@localhost:5432/smart_tourist_db' });

const reviews = [
  {
    id: 'review-seed-1',
    userId: 'user-1',
    userName: 'Demo Tourist',
    rating: 5,
    text: 'Amazing experience! The lockers are super easy to use and very secure. Highly recommend for anyone traveling in Dhaka.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'review-seed-2',
    userId: 'user-1',
    userName: 'John Doe',
    rating: 4,
    text: 'Very convenient locations. Saved me a lot of trouble carrying my heavy bags around Aftabnagar.',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'review-seed-3',
    userId: 'user-1',
    userName: 'Sara Ahmed',
    rating: 5,
    text: 'The OTP system makes it feel very safe. Customer support was also very helpful when I had questions.',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

async function seed() {
  await pool.query('CREATE TABLE IF NOT EXISTS smart_tourist_reviews (id TEXT PRIMARY KEY, data JSONB NOT NULL)');
  for (const r of reviews) {
    await pool.query('INSERT INTO smart_tourist_reviews (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', [r.id, JSON.stringify(r)]);
  }
  console.log('Seeded 3 reviews.');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
