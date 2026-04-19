import pg from 'pg';
const { Client } = pg;

async function initDatabase() {
  // Connect to default postgres database to create smart_tourist_db
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password123',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'smart_tourist_db'");
    if (res.rows.length === 0) {
      await client.query('CREATE DATABASE smart_tourist_db');
      console.log('Database smart_tourist_db created');
    } else {
      console.log('Database smart_tourist_db already exists');
    }

    await client.end();

    // Now connect to smart_tourist_db to create tables
    const dbClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password123',
      database: 'smart_tourist_db'
    });

    await dbClient.connect();
    console.log('Connected to smart_tourist_db');

    // Create tables
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS destinations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS stations (
        id VARCHAR(255) PRIMARY KEY,
        destination_id VARCHAR(255) REFERENCES destinations(id),
        name VARCHAR(255) NOT NULL,
        receptionist_id VARCHAR(255),
        total_lockers INTEGER NOT NULL,
        available_lockers INTEGER NOT NULL,
        booked_lockers INTEGER NOT NULL,
        processing_lockers INTEGER NOT NULL,
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS lockers (
        id VARCHAR(255) PRIMARY KEY,
        station_id VARCHAR(255) REFERENCES stations(id),
        number INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        next_available_at TIMESTAMP NULL,
        partial_available_hours INTEGER NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        email VARCHAR(255),
        address TEXT,
        photo_url TEXT
      );

      CREATE TABLE IF NOT EXISTS receptionists (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        station_id VARCHAR(255) REFERENCES stations(id),
        station_name VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        user_name VARCHAR(255),
        station_id VARCHAR(255) REFERENCES stations(id),
        station_name VARCHAR(255),
        destination_name VARCHAR(255),
        locker_id VARCHAR(255) REFERENCES lockers(id),
        locker_number INTEGER,
        duration_hours INTEGER,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        actual_check_in_time TIMESTAMP NULL,
        actual_check_out_time TIMESTAMP NULL,
        status VARCHAR(50),
        amount DECIMAL(10,2),
        paid_amount DECIMAL(10,2),
        refund_amount DECIMAL(10,2),
        penalty_percent DECIMAL(5,2),
        due_amount DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payment_records (
        id VARCHAR(255) PRIMARY KEY,
        booking_id VARCHAR(255) REFERENCES bookings(id),
        user_id VARCHAR(255) REFERENCES users(id),
        station_id VARCHAR(255) REFERENCES stations(id),
        type VARCHAR(50),
        amount DECIMAL(10,2),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        actor_role VARCHAR(50),
        actor_name VARCHAR(255),
        action_type VARCHAR(255),
        entity_type VARCHAR(255),
        entity_id VARCHAR(255),
        previous_value TEXT,
        new_value TEXT,
        station_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await dbClient.query(createTablesSQL);
    console.log('Tables created successfully');

    await dbClient.end();
    console.log('Database initialization complete');

  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

initDatabase();