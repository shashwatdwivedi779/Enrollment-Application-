const bcrypt  = require('bcrypt');
const Student = require('../model/forms');


// ──────────────────────────────────────────────────────────────
// GET /student/login  →  Show student login page
// ──────────────────────────────────────────────────────────────
exports.GetLogin = (req, res) => {
    res.render('student/login', { errors: [] });
};


// ──────────────────────────────────────────────────────────────
// POST /student/login  →  Authenticate student
// ──────────────────────────────────────────────────────────────
exports.PostLogin = async (req, res) => {
    const { rollNumber, password } = req.body;
    const errors = [];

    if (!rollNumber || !password) {
        errors.push('Roll number and password are required.');
        return res.status(422).render('student/login', { errors });
    }

    try {
        // Find student by roll number
        const student = await Student.findOne({ rollNumber: rollNumber.trim() });

        // Generic error message to avoid username enumeration
        if (!student) {
            errors.push('Invalid roll number or password.');
            return res.status(422).render('student/login', { errors });
        }

        // Pending students cannot log in
        if (student.status === 'pending') {
            errors.push('Your application is still pending approval. Please check back later.');
            return res.status(403).render('student/login', { errors });
        }

        // Rejected students cannot log in
        if (student.status === 'rejected') {
            errors.push('Your application has been rejected. Please contact the administration.');
            return res.status(403).render('student/login', { errors });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            errors.push('Invalid roll number or password.');
            return res.status(422).render('student/login', { errors });
        }

        // ── Create student session ─────────────────────────────
        req.session.isStudentLoggedIn   = true;
        req.session.studentId           = student._id.toString();
        req.session.studentName         = student.fullName;
        req.session.studentRollNumber   = student.rollNumber;
        req.session.isTemporaryPassword = student.isTemporaryPassword;

        // If using temporary password, redirect to change-password page
        if (student.isTemporaryPassword) {
            req.flash('error_msg', '⚠️ You are using a temporary password. Please set a new password to continue.');
            return res.redirect('/student/change-password');
        }

        return res.redirect('/student/dashboard');

    } catch (error) {
        console.error('Student Login Error:', error);
        errors.push('Something went wrong. Please try again.');
        return res.status(500).render('student/login', { errors });
    }
};


// ──────────────────────────────────────────────────────────────
// GET /student/dashboard  →  Student home dashboard
// ──────────────────────────────────────────────────────────────
exports.GetDashboard = async (req, res) => {
    try {
        const student = await Student.findById(req.session.studentId);

        if (!student) {
            req.session.destroy();
            return res.redirect('/student/login');
        }

        res.render('student/dashboard', { student });

    } catch (error) {
        console.error('Student Dashboard Error:', error);
        req.flash('error_msg', 'Failed to load dashboard.');
        res.redirect('/student/login');
    }
};


// ──────────────────────────────────────────────────────────────
// GET /student/profile  →  Student full profile
// ──────────────────────────────────────────────────────────────
exports.GetProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.session.studentId);

        if (!student) {
            req.session.destroy();
            return res.redirect('/student/login');
        }

        res.render('student/profile', { student });

    } catch (error) {
        console.error('Student Profile Error:', error);
        req.flash('error_msg', 'Failed to load profile.');
        res.redirect('/student/dashboard');
    }
};


// ──────────────────────────────────────────────────────────────
// GET /student/results  →  Results page (coming soon)
// ──────────────────────────────────────────────────────────────
exports.GetResults = async (req, res) => {
    try {
        const student = await Student.findById(req.session.studentId);
        res.render('student/results', { student });
    } catch (error) {
        console.error('Results Error:', error);
        req.flash('error_msg', 'Failed to load results.');
        res.redirect('/student/dashboard');
    }
};


// ──────────────────────────────────────────────────────────────
// GET /student/change-password  →  Show change password form
// ──────────────────────────────────────────────────────────────
exports.GetChangePassword = async (req, res) => {
    try {
        const student = await Student.findById(req.session.studentId);
        res.render('student/change_password', { student, errors: [] });
    } catch (error) {
        console.error('Change Password GET Error:', error);
        res.redirect('/student/dashboard');
    }
};


// ──────────────────────────────────────────────────────────────
// POST /student/change-password  →  Process password change
// ──────────────────────────────────────────────────────────────
exports.PostChangePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const errors = [];

    // ── Validation ─────────────────────────────────────────────
    if (!currentPassword || !newPassword || !confirmPassword) {
        errors.push('All fields are required.');
    }

    if (newPassword && newPassword.length < 8) {
        errors.push('New password must be at least 8 characters long.');
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        errors.push('New password and confirm password do not match.');
    }

    // Password strength: at least one letter and one number
    if (newPassword && !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
        errors.push('Password must contain at least one letter and one number.');
    }

    if (errors.length > 0) {
        const student = await Student.findById(req.session.studentId);
        return res.status(422).render('student/change_password', { student, errors });
    }

    try {
        const student = await Student.findById(req.session.studentId);

        if (!student) {
            req.session.destroy();
            return res.redirect('/student/login');
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, student.password);

        if (!isMatch) {
            errors.push('Current password is incorrect.');
            return res.status(422).render('student/change_password', { student, errors });
        }

        // Prevent reusing the same password
        const isSame = await bcrypt.compare(newPassword, student.password);
        if (isSame) {
            errors.push('New password cannot be the same as the current password.');
            return res.status(422).render('student/change_password', { student, errors });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        student.password = hashedPassword;
        student.isTemporaryPassword = false;  // ← clear the temp flag

        await student.save();

        // Update session flag
        req.session.isTemporaryPassword = false;

        req.flash('success_msg', '✅ Password changed successfully! Welcome to the portal.');
        return res.redirect('/student/dashboard');

    } catch (error) {
        console.error('Change Password Error:', error);
        errors.push('Something went wrong. Please try again.');
        const student = await Student.findById(req.session.studentId);
        return res.status(500).render('student/change_password', { student, errors });
    }
};


// ──────────────────────────────────────────────────────────────
// POST /student/logout  →  Destroy student session
// ──────────────────────────────────────────────────────────────
exports.PostLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destroy error:', err);
        }
        res.redirect('/student/login');
    });
};
