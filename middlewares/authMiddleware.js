// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Guards for protecting routes based on who is logged in.

/**
 * isMaster — only allows access if the Master is logged in via OTP.
 * Used on all /master/* routes.
 */
exports.isMaster = (req, res, next) => {
    if (req.session && req.session.isMasterLoggedIn) {
        return next();
    }
    req.flash('error_msg', 'Please log in as Master to access this page.');
    return res.redirect('/master/login');
};


/**
 * isStudent — only allows access if a Student is logged in.
 * Used on all /student/dashboard/* routes.
 */
exports.isStudent = (req, res, next) => {
    if (req.session && req.session.isStudentLoggedIn) {
        return next();
    }
    req.flash('error_msg', 'Please log in to access your dashboard.');
    return res.redirect('/student/login');
};


/**
 * requirePasswordChange — if student is using a temporary password,
 * force them to change it before accessing any other page.
 */
exports.requirePasswordChange = (req, res, next) => {
    if (req.session.isStudentLoggedIn && req.session.isTemporaryPassword) {
        // Allow the change-password page itself through
        if (req.path === '/change-password') return next();
        req.flash('error_msg', 'You must change your temporary password before continuing.');
        return res.redirect('/student/change-password');
    }
    return next();
};


/**
 * redirectIfMasterLoggedIn — redirect to dashboard if already logged in.
 * Prevents Master from seeing the login page again.
 */
exports.redirectIfMasterLoggedIn = (req, res, next) => {
    if (req.session && req.session.isMasterLoggedIn) {
        return res.redirect('/master/dashboard');
    }
    return next();
};


/**
 * redirectIfStudentLoggedIn — redirect to dashboard if student already logged in.
 */
exports.redirectIfStudentLoggedIn = (req, res, next) => {
    if (req.session && req.session.isStudentLoggedIn) {
        return res.redirect('/student/dashboard');
    }
    return next();
};
