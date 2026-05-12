require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const { 
    db, getClients, addClient, getCasesByClient, addCase,
    getPaymentsByClient, addPayment, addMeeting, getApplications,
    getTodaysMeetings
} = require('./database');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'lawyer_crm_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Login middleware
const requireAuth = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/');
    }
};

// Login sahifasi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Admin dashboard
app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============ API ENDPOINTS ============

// Mijozlar
app.get('/api/clients', requireAuth, (req, res) => {
    getClients((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/clients', requireAuth, (req, res) => {
    addClient(req.body, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// Ishlar
app.get('/api/cases/:clientId', requireAuth, (req, res) => {
    getCasesByClient(req.params.clientId, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/cases', requireAuth, (req, res) => {
    addCase(req.body, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

// To'lovlar
app.get('/api/payments/:clientId', requireAuth, (req, res) => {
    getPaymentsByClient(req.params.clientId, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/payments', requireAuth, (req, res) => {
    addPayment(req.body, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Uchrashuvlar
app.post('/api/meetings', requireAuth, (req, res) => {
    addMeeting(req.body, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/todays-meetings', requireAuth, (req, res) => {
    getTodaysMeetings((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Arizalar
app.get('/api/applications', requireAuth, (req, res) => {
    getApplications((err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Statistika
app.get('/api/stats', requireAuth, (req, res) => {
    db.get("SELECT COUNT(*) as total_clients FROM clients", [], (err, clients) => {
        db.get("SELECT COUNT(*) as total_cases FROM cases", [], (err, cases) => {
            db.get("SELECT SUM(paid_amount) as total_income FROM payments", [], (err, income) => {
                db.get("SELECT COUNT(*) as pending_apps FROM applications WHERE status = 'kutilmoqda'", [], (err, apps) => {
                    res.json({
                        total_clients: clients?.total_clients || 0,
                        total_cases: cases?.total_cases || 0,
                        total_income: income?.total_income || 0,
                        pending_applications: apps?.pending_apps || 0
                    });
                });
            });
        });
    });
});

module.exports = app;