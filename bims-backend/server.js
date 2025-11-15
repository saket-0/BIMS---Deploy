// Lap/bims-backend/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

// --- 1. Import Route Files ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const blockchainRoutes = require('./routes/blockchain');
const analyticsRoutes = require('./routes/analytics');
const locationRoutes = require('./routes/locations'); 
const categoryRoutes = require('./routes/categories'); 
const imageRoutes = require('./routes/image'); // <-- ADDED

const app = express();
// --- MODIFIED: Use environment variables, default to 3000 ---
const port = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://bims-app.netlify.app/';

// --- 2. Database Connection ---
// --- MODIFIED: Use DATABASE_URL from Render ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false
});
// --- END MODIFICATION ---

// --- ** NEW: SSE Client Storage ** ---
let sseClients = [];

/**
 * ** NEW: Broadcasts a message to all connected SSE clients
 * @param {string} eventName The name of the event (e.g., 'new-block')
 * @param {object} data The data object to send
 */
const broadcastToClients = (eventName, data) => {
    console.log(`Broadcasting event '${eventName}' to ${sseClients.length} clients...`);
    
    // Format the SSE message
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    
    sseClients.forEach(client => {
        client.res.write(message);
    });
};
// --- ** END NEW ** ---

// --- MODIFIED: CRITICAL for Render deployment ---
app.set('trust proxy', 1);
// --- END MODIFICATION ---

// --- 3. CORS Setup ---
// --- MODIFIED: Use dynamic CORS Origin ---
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if the origin is in our allowed list
        const allowedOrigins = [
            CORS_ORIGIN,
            'http://127.0.0.1:5500', 
            'http://localhost:5500', 
            'http://127.0.0.1:5501', 
            'http://localhost:5501'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log(`CORS Error: Origin ${origin} not allowed.`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));
// --- END MODIFICATION ---

// --- 4. Body Parser ---
app.use(express.json());

// --- 5. Session Setup ---
// ** MODIFIED: Store session middleware in a variable **
const sessionMiddleware = session({
    store: new PgSession({
        pool: pool,
        tableName: 'user_sessions'
    }),
    // --- MODIFIED: Use environment variable for secret ---
    secret: process.env.SESSION_SECRET || 'your_very_strong_secret_key_here',
    // --- END MODIFICATION ---
    resave: false,
    saveUninitialized: false,
    proxy: true, // --- CRITICAL for Render ---
    cookie: {
        maxAge: 5 * 60 * 1000, // 5 minutes
        httpOnly: true,
        // --- MODIFIED: Secure cookies required for cross-site ---
        secure: IS_PRODUCTION, // true in production
        sameSite: IS_PRODUCTION ? 'none' : 'lax', // 'none' for cross-site
        // --- END MODIFICATION ---
        path: '/',
        domain: undefined
    },
    name: 'bims.sid',
    rolling: true // This resets the 5-minute timer on every API call
});
app.use(sessionMiddleware); // Use the middleware

// --- 6. Debug Middleware ---
app.use((req, res, next) => {
    console.log('\n--- NEW REQUEST ---');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Origin:', req.headers.origin);
    console.log('Cookie Header:', req.headers.cookie);
    console.log('Session User:', req.session.user ? req.session.user.email : 'NONE');
    next();
});

// --- 7. Mount API Endpoints ---
// Pass the 'pool' object to the route handlers
app.use('/api/auth', authRoutes(pool));
app.use('/api/users', userRoutes(pool));
// *** MODIFIED: Pass broadcastToClients to blockchain routes ***
app.use('/api/blockchain', blockchainRoutes(pool, broadcastToClients));
app.use('/api/analytics', analyticsRoutes(pool));
app.use('/api/locations', locationRoutes(pool)); 
app.use('/api/categories', categoryRoutes(pool)); 
app.use('/api/image', imageRoutes(pool)); // <-- ADDED

// --- ** 8. NEW: Server-Sent Events (SSE) Endpoint ** ---
const isAuthenticatedSSE = (req, res, next) => {
    // This middleware re-checks authentication for the persistent SSE connection
    if (req.session.user) {
        next();
    } else {
        // Don't send JSON, just end the request for SSE
        console.log('❌ SSE connection blocked: Not authenticated');
        res.status(401).end('Not authenticated');
    }
};

app.get('/api/events', sessionMiddleware, isAuthenticatedSSE, (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Send headers immediately

    const clientId = req.session.user.id;
    const clientEmail = req.session.user.email;
    const newClient = { id: clientId, res: res };
    sseClients.push(newClient);
    console.log(`Client ${clientEmail} (ID: ${clientId}) connected to SSE.`);

    // Send a connection confirmation
    res.write('event: connected\ndata: Session established\n\n');

    // Handle client disconnect
    req.on('close', () => {
        console.log(`Client ${clientEmail} (ID: ${clientId}) disconnected from SSE.`);
        sseClients = sseClients.filter(client => client.res !== res);
    });
});
// --- ** END NEW SSE SECTION ** ---


// --- 9. Start Server ---
// --- MODIFIED: Use dynamic port and 0.0.0.0 for Render ---
app.listen(port, '0.0.0.0', () => {
    console.log('\n=================================');
    console.log('🚀 BIMS Server Started');
    console.log('=================================');
    console.log(`URL: http://127.0.0.1:${port}`);
    console.log(`CORS Origin Allowed: ${CORS_ORIGIN}`);
    console.log(`Production Mode: ${IS_PRODUCTION}`);
    console.log('=================================\n');
});
// --- END MODIFICATION ---