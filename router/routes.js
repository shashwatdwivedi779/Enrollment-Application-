const express = require('express');
const router = express.Router();

const HomeController   = require('../controller/homeController');
const AuthController   = require('../controller/authcontroller');

// ── Home / Landing ─────────────────────────────────────────────
router.get('/', HomeController.GetHome);

// ── Student Registration ───────────────────────────────────────
router.get('/register', HomeController.GetRegister);
router.post('/register', HomeController.PostRegister);
router.get('/register/success', HomeController.GetRegisterSuccess);

// ── Master Login ───────────────────────────────────────────────
// (legacy route kept for backwards compat; masterRoutes.js handles /master/login)
router.get('/login', AuthController.GetMasterLogin);

module.exports = router;