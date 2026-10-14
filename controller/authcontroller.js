const otp_send = require('../middlewares/otp_manager');
const otp_data = require('../model/otp');

// ──────────────────────────────────────────────────────────────
// GET /master/login  →  Show Master login page
// (Also handles /login for backwards compatibility)
// ──────────────────────────────────────────────────────────────
exports.GetMasterLogin = (req, res) => {
    res.render('master/login', { errors: [], otpSent: false });
};


// ──────────────────────────────────────────────────────────────
// POST /master/login  →  Step 1: Verify credentials → send OTP
//                        Step 2: Verify OTP → create session
// ──────────────────────────────────────────────────────────────
exports.PostMasterLogin = async (req, res) => {

    try {
        const { email, password, otp } = req.body;

        // ── STEP 2: OTP VERIFICATION ───────────────────────────
        // If 'otp' field is present in the request body, the user has
        // already passed credential check and is submitting their OTP.

        if (otp) {

            const storedOTP = await otp_data.findOne({ email });

            if (!storedOTP) {
                return res.status(422).render('master/login', {
                    errors: ['OTP not found or expired. Please log in again.'],
                    otpSent: false,
                    email
                });
            }

            // Manual expiry check (belt-and-suspenders alongside MongoDB TTL)
            if (storedOTP.expiresAt <= new Date()) {
                await otp_data.deleteOne({ _id: storedOTP._id });
                return res.status(422).render('master/login', {
                    errors: ['Your OTP has expired. Please log in again.'],
                    otpSent: false,
                    email
                });
            }

            // Prevent brute-force on OTP
            if (storedOTP.attempts >= 5) {
                await otp_data.deleteOne({ _id: storedOTP._id });
                return res.status(429).render('master/login', {
                    errors: ['Maximum OTP attempts exceeded. Please log in again.'],
                    otpSent: false,
                    email
                });
            }

            // Verify OTP using timing-safe comparison
            const isValidOTP = otp_send.VerifyOTP(otp, storedOTP.otp);

            if (!isValidOTP) {
                // Increment failed attempt count
                await otp_data.updateOne(
                    { _id: storedOTP._id },
                    { $inc: { attempts: 1 } }
                );
                const remaining = 4 - storedOTP.attempts;
                return res.status(422).render('master/login', {
                    errors: [`Invalid OTP. ${remaining} attempt(s) remaining.`],
                    otpSent: true,
                    email
                });
            }

            // ── OTP VERIFIED — delete it immediately ───────────
            await otp_data.deleteOne({ _id: storedOTP._id });

            // Create authenticated Master session
            req.session.isMasterLoggedIn = true;
            req.session.masterEmail = email;

            req.flash('success_msg', 'Welcome, Master! You are now logged in.');
            return res.redirect('/master/dashboard');
        }


        // ── STEP 1: EMAIL + PASSWORD VERIFICATION ─────────────

        if (!email || !password) {
            return res.status(422).render('master/login', {
                errors: ['Email and password are required.'],
                otpSent: false
            });
        }

        // Check master email (case-insensitive)
        if (email.trim().toLowerCase() !== process.env.MASTERS_EMAIL.trim().toLocaleLowerCase()) {
            return res.status(422).render('master/login', {
                errors: ['Invalid email or password.'],
                otpSent: false
            });
        }

        // Check master password (plain comparison; stored in .env)
        if (password !== process.env.MASTERS_PASSWORD) {
            return res.status(422).render('master/login', {
                errors: ['Invalid email or password.'],
                otpSent: false
            });
        }

        // ── Credentials OK — send OTP ──────────────────────────
        const otpSendSuccess = await otp_send.OtpSender(email.trim().toLowerCase());

        if (!otpSendSuccess) {
            return res.status(500).render('master/login', {
                errors: ['Unable to send OTP. Please check the server email configuration.'],
                otpSent: false
            });
        }

        // Show OTP input form
        return res.status(200).render('master/login', {
            errors: [],
            otpSent: true,
            email: email.trim().toLowerCase()
        });

    } catch (error) {
        console.error('Master Login Error:', error);
        return res.status(500).render('master/login', {
            errors: ['Internal server error. Please try again.'],
            otpSent: false
        });
    }
};