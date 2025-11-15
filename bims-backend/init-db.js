// bims-backend/init-db.js
const { Pool } = require('pg');
const { seedDatabase } = require('./seed.js'); // Import the seeder function

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Use the same DB connection logic as the server
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://deep:password@localhost:5432/bims',
    ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false
});

const CREATE_TABLES_SQL = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        is_archived BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        is_archived BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS blockchain (
        index INTEGER PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        transaction JSONB NOT NULL,
        previous_hash TEXT NOT NULL,
        hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
    )
    WITH (OIDS=FALSE);
    ALTER TABLE user_sessions ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

    CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        login_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`;

async function initializeDatabase() {
    console.log('--- Database Initialization Started ---');
    const client = await pool.connect();
    
    try {
        console.log('1. Creating tables if they do not exist...');
        await client.query(CREATE_TABLES_SQL);
        console.log('   ...Tables created successfully.');
        
        console.log('2. Running database seeder...');
        // Pass the connected client to the seeder so it runs in the same transaction
        await seedDatabase(client); 
        console.log('   ...Database seeded successfully.');
        
        console.log('--- Database Initialization Complete ---');
    } catch (e) {
        console.error('!!! ERROR during database initialization !!!');
        console.error(e);
        process.exit(1); // Exit with error code to stop the build
    } finally {
        client.release();
        pool.end(); // End the pool connection so the script exits
    }
}

// Run the initialization
initializeDatabase();