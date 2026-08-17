const express = require('express');
const app = express();

exports.jwt = require('jsonwebtoken');
const helmet = require('helmet');
exports.dotenv = require('dotenv').config();
exports.applicationkey = process.env.APPLICATION_KEY;

const port = process.env.PORT || 7850;
const hostname = process.env.HOST_NAME || '0.0.0.0';

const path = require('path');
const cors = require('cors');
const dbm = require('./utilities/dbMongo');
const bodyParser = require('body-parser');

const globalRoutes = require('./routes/global');

// ✅ Body Parser
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));

// ✅ Static (KEEP OLD PATH — IMPORTANT)
app.use('/auth/static', express.static(path.join(__dirname, 'uploads')));

// ✅ CORS (SAFE + CONTROLLED)
const allowedOrigins = [
    "https://preconsole.ovationwps.com",
    "https://prevantage.ovationwps.com",
    "https://console.ovationwps.com",
    "http://localhost:3000",
    "http://localhost:4200",
    "http://localhost:4300",
    "http://localhost:7850",
    "http://localhost:4700",
	"http://localhost:4800",
    "https://myvantage.ovationwps.com"
];

const corsMiddleware = cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // mobile / postman
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("Blocked Origin:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    }
});

// ✅ Skip CORS for email routes
app.use((req, res, next) => {
    const emailRoutes = [
        '/inventoryRequest/processTokenRequest',
        '/inventoryRequest/updateRequestStatusEmail'
    ];
    const isEmailRoute = emailRoutes.some(r => req.path.startsWith(r));
    if (isEmailRoute) return next();
    return corsMiddleware(req, res, next);
});

app.use(helmet());
app.disable('x-powered-by');
//app.use(cors());


// ✅ Debug Logs (ONLY NON-PROD)
//if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log("\n**********");
        console.log("Method :", req.method);
        console.log("URL    :", req.url);
        console.log("Origin :", req.headers.origin);
        console.log("Body   :", JSON.stringify(req.body));
        console.log("**********\n");
        next();
    });
//}

// ✅ KEEP OLD ROUTE PREFIX (CRITICAL)
app.use('/auth/', globalRoutes);

// ✅ Scheduler
require("./utilities/scheduler").schedulerJob();

async function startApp() {
    try {
        await dbm.connectToDatabase();
        console.log("Database connection established.");

        let server;

        if (process.env.NODE_ENV === 'production') {
            // // 🔒 HTTPS (Production)
            // const https = require('http');
            // const fs = require('fs');

            // const options = {
            //     key: fs.readFileSync("./utilities/webkey.key"),
            //     cert: fs.readFileSync("./utilities/webcert.crt"),
            //     ca: fs.readFileSync("./utilities/webca.crt"),
            //     requestCert: false,
            //     rejectUnauthorized: false
            // };

            // server = https.createServer(options, app);
            // 🌐 HTTP (Local)
            const http = require('http');
            server = http.createServer(app);
            console.log("Running in PRODUCTION mode (HTTPS)");

        } else {
            // 🌐 HTTP (Local)
            const http = require('http');
            server = http.createServer(app);
            console.log("Running in LOCAL mode (HTTP)");
        }

        server.listen(port, hostname, () => {
            console.log(`Server running on ${hostname}:${port}`);
        });

    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
}

startApp();