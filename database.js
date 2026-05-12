const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./lawyer.db');

// Barcha jadvallarni yaratish
db.serialize(() => {
    // Advokatlar (faqat bitta)
    db.run(`
        CREATE TABLE IF NOT EXISTS lawyers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // Mijozlar
    db.run(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT,
            phone TEXT,
            passport TEXT,
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ishlar (Cases)
    db.run(`
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            case_type TEXT,
            description TEXT,
            status TEXT DEFAULT 'yangi',
            court_date DATETIME,
            deadline DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )
    `);

    // To'lovlar
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            amount REAL,
            paid_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'qarz',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )
    `);

    // Uchrashuvlar
    db.run(`
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            title TEXT,
            meeting_date DATETIME,
            location TEXT,
            notes TEXT,
            reminder_sent INTEGER DEFAULT 0,
            FOREIGN KEY(client_id) REFERENCES clients(id)
        )
    `);

    // Hujjatlar (template yoki mijoz hujjatlari)
    db.run(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            case_id INTEGER,
            title TEXT,
            file_path TEXT,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ariza (mijoz web yoki bot orqali yozadi)
    db.run(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT,
            client_phone TEXT,
            case_type TEXT,
            message TEXT,
            status TEXT DEFAULT 'kutilmoqda',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Helper funksiyalar
module.exports = {
    db,
    // Mijozlar
    getClients: (callback) => {
        db.all("SELECT * FROM clients ORDER BY created_at DESC", callback);
    },
    addClient: (client, callback) => {
        const { fullname, phone, passport, address } = client;
        db.run(
            "INSERT INTO clients (fullname, phone, passport, address) VALUES (?, ?, ?, ?)",
            [fullname, phone, passport, address],
            callback
        );
    },
    // Ishlar
    getCasesByClient: (clientId, callback) => {
        db.all("SELECT * FROM cases WHERE client_id = ?", [clientId], callback);
    },
    addCase: (caseData, callback) => {
        const { client_id, case_type, description, court_date, deadline } = caseData;
        db.run(
            "INSERT INTO cases (client_id, case_type, description, court_date, deadline) VALUES (?, ?, ?, ?, ?)",
            [client_id, case_type, description, court_date, deadline],
            callback
        );
    },
    // To'lovlar
    getPaymentsByClient: (clientId, callback) => {
        db.all("SELECT * FROM payments WHERE client_id = ?", [clientId], callback);
    },
    addPayment: (payment, callback) => {
        const { client_id, amount, paid_amount } = payment;
        db.run(
            "INSERT INTO payments (client_id, amount, paid_amount, status) VALUES (?, ?, ?, ?)",
            [client_id, amount, paid_amount, paid_amount >= amount ? 'to‘langan' : 'qarz'],
            callback
        );
    },
    // Uchrashuvlar
    getTodaysMeetings: (callback) => {
        db.all(`
            SELECT m.*, c.fullname, c.phone 
            FROM meetings m 
            JOIN clients c ON m.client_id = c.id 
            WHERE DATE(m.meeting_date) = DATE('now') AND m.reminder_sent = 0
        `, callback);
    },
    addMeeting: (meeting, callback) => {
        const { client_id, title, meeting_date, location, notes } = meeting;
        db.run(
            "INSERT INTO meetings (client_id, title, meeting_date, location, notes) VALUES (?, ?, ?, ?, ?)",
            [client_id, title, meeting_date, location, notes],
            callback
        );
    },
    markReminderSent: (meetingId, callback) => {
        db.run("UPDATE meetings SET reminder_sent = 1 WHERE id = ?", [meetingId], callback);
    },
    // Ariza
    addApplication: (app, callback) => {
        const { client_name, client_phone, case_type, message } = app;
        db.run(
            "INSERT INTO applications (client_name, client_phone, case_type, message) VALUES (?, ?, ?, ?)",
            [client_name, client_phone, case_type, message],
            callback
        );
    },
    getApplications: (callback) => {
        db.all("SELECT * FROM applications ORDER BY created_at DESC", callback);
    }
};