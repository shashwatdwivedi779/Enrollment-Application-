const express = require('express');
const router = express.Router();

const StudentController = require('../controller/studentController');
const auth = require('../middlewares/authMiddleware');

// ── Student Login / Logout ─────────────────────────────────────
router.get('/login', auth.redirectIfStudentLoggedIn, StudentController.GetLogin);
router.post('/login', auth.redirectIfStudentLoggedIn, StudentController.PostLogin);
router.post('/logout', StudentController.PostLogout);

// ── Student Dashboard (protected) ─────────────────────────────
// requirePasswordChange forces students with temp passwords to /change-password first
router.get('/dashboard', auth.isStudent, auth.requirePasswordChange, StudentController.GetDashboard);
router.get('/profile', auth.isStudent, auth.requirePasswordChange, StudentController.GetProfile);
router.get('/results', auth.isStudent, auth.requirePasswordChange, StudentController.GetResults);

// ── Change Password (accessible even with temp password) ───────
router.get('/change-password', auth.isStudent, StudentController.GetChangePassword);
router.post('/change-password', auth.isStudent, StudentController.PostChangePassword);

module.exports = router;
