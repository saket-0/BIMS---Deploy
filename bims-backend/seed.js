// seed.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// --- MODIFIED: Use DATABASE_URL from environment ---
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// --- MODIFIED: Create a *separate* pool just for seeding if run standalone ---
// The init-db.js script will pass its *own* client
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://deep:password@localhost:5432/bims',
    ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false
});
// --- END MODIFICATION ---

const MOCK_USERS = [
    { employeeId: 'EMP-20251029-0001', name: 'Dr. Admin Ji', email: 'admin@bims.com', role: 'Admin' },
    { employeeId: 'EMP-20251029-0002', name: 'Manager Babu', email: 'manager@bims.com', role: 'Inventory Manager' },
    { employeeId: 'EMP-20251029-0003', name: 'Auditor Saabji', email: 'auditor@bims.com', role: 'Auditor' }
];

const MOCK_LOCATIONS = [
    'Supplier',
    'Warehouse',
    'Retailer'
];

const MOCK_CATEGORIES = [
    'Electronics',
    'Clothing',
    'Groceries',
    'Uncategorized'
];

// --- MODIFIED: Function now accepts a client, but can also create its own ---
async function seedDatabase(client) {
    console.log('Seeding database...');
    // If a client wasn't passed, create one for standalone execution
    const standalone = !client;
    const dbClient = client || await pool.connect();
    
    try {
        await dbClient.query('BEGIN'); // Start transaction
        
        // --- 1. Seed Users ---
        console.log('Seeding users...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password', salt);

        for (const user of MOCK_USERS) {
            // --- MODIFIED: Check if users table is empty first ---
            const check = await dbClient.query('SELECT 1 FROM users LIMIT 1');
            if (check.rows.length === 0) {
                await dbClient.query(
                    `INSERT INTO users (employee_id, name, email, role, password_hash)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    employee_id = EXCLUDED.employee_id,
                    role = EXCLUDED.role;`,
                    [user.employeeId, user.name, user.email, user.role, passwordHash]
                );
            } else {
                console.log('   ...Users table not empty, skipping user seed.');
                break; // Stop loop
            }
        }
        console.log('Users seeded.');

        // --- 2. Seed Locations ---
        console.log('Seeding locations...');
        const locCheck = await dbClient.query('SELECT 1 FROM locations LIMIT 1');
        if (locCheck.rows.length === 0) {
            for (const locName of MOCK_LOCATIONS) {
                await dbClient.query(
                    `INSERT INTO locations (name) VALUES ($1)
                     ON CONFLICT (name) DO NOTHING;`,
                    [locName]
                );
            }
        } else {
             console.log('   ...Locations table not empty, skipping location seed.');
        }
        console.log('Locations seeded.');

        // --- 3. Seed Categories ---
        console.log('Seeding categories...');
        const catCheck = await dbClient.query('SELECT 1 FROM categories LIMIT 1');
        if (catCheck.rows.length === 0) {
            for (const catName of MOCK_CATEGORIES) {
                await dbClient.query(
                    `INSERT INTO categories (name) VALUES ($1)
                     ON CONFLICT (name) DO NOTHING;`,
                    [catName]
                );
            }
        } else {
            console.log('   ...Categories table not empty, skipping category seed.');
        }
        console.log('Categories seeded.');
        
        await dbClient.query('COMMIT'); // Commit transaction
        console.log('Database seeded successfully!');
    } catch (e) {
        await dbClient.query('ROLLBACK'); // Rollback on error
        console.error('Error seeding database:', e);
        if (standalone) { // Only exit if running standalone
             process.exit(1);
        } else {
            throw e; // Re-throw error for init-db.js to catch
        }
    } finally {
        // Only release/end if we created the client in *this* function
        if (standalone) {
            dbClient.release();
            pool.end();
        }
    }
}

// --- MODIFIED: Export the function and remove self-execution ---
module.exports = { seedDatabase };
// --- END MODIFICATION ---