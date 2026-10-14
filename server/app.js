const path = require('path');
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');

const masterRoutes = require('../router/masterRoutes');
const studentRoutes = require('../router/studentRoutes');
const publicRoutes = require('../router/routes');

const app = express();

// ─── View Engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
// Views folder is inside presentation/views
app.set('views', path.join(__dirname, '../views'));

// ─── Static Files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ─── Body Parsers ─────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ─── Session ──────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_change_this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
        httpOnly: true
    }
}));

// ─── Flash Messages ───────────────────────────────────────────
app.use(flash());

// Make flash messages and session available in all EJS templates
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.errors = req.flash('errors');
    res.locals.isMasterLoggedIn = req.session.isMasterLoggedIn || false;
    res.locals.isStudentLoggedIn = req.session.isStudentLoggedIn || false;
    next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/', publicRoutes);
app.use('/master', masterRoutes);
app.use('/student', studentRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('404');
});

// ─── Database + Server Start ──────────────────────────────────
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/college';
const PORT = process.env.PORT || 3050;

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log('✅ MongoDB Connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });