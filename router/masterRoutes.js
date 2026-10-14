const express = require('express');
const router  = express.Router();

const MasterController = require('../controller/masterController');
const auth = require('../middlewares/authMiddleware');

// ── Master Login / Logout ──────────────────────────────────────
router.get('/login',  auth.redirectIfMasterLoggedIn, MasterController.GetLogin);
router.post('/login', auth.redirectIfMasterLoggedIn, MasterController.PostLogin);

// ── Master Dashboard (protected) ──────────────────────────────
router.get('/dashboard', auth.isMaster, MasterController.GetDashboard);

// ── Students Listing Page (protected) ─────────────────────────
router.get('/students', auth.isMaster, MasterController.GetStudentsList);

// ── Individual Student Detail & Actions (protected) ───────────
router.get('/student/:id',          auth.isMaster, MasterController.GetStudentDetail);
router.post('/student/:id/approve', auth.isMaster, MasterController.PostApproveStudent);
router.post('/student/:id/reject',  auth.isMaster, MasterController.PostRejectStudent);

// ── Master Logout ──────────────────────────────────────────────
router.post('/logout', auth.isMaster, MasterController.PostLogout);

module.exports = router;
