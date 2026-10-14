const bcrypt  = require('bcrypt');
const Student = require('../model/forms');
const nodemailer = require('nodemailer');

// ── Nodemailer transporter ─────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const COLLEGE_CODE = '0601';

/**
 * Generate a random memorable password.
 * Format: <word><special><word-suffix><digits>
 * Examples: anura&@15, blaze#91, rapid@42
 * At least 8 chars, contains letters, a special char, and digits.
 */
function generateRandomPassword() {
    const prefixes  = ['anura','blaze','rapid','nexus','sigma','forge','orbit',
                       'viper','solar','delta','storm','comet','prism','nova'];
    const specials  = ['&@','#!','@%','!&','*#','$@','%!','&#','@!','#@'];
    const digits    = () => String(Math.floor(Math.random() * 90) + 10); // 10-99

    const word    = prefixes[Math.floor(Math.random() * prefixes.length)];
    const special = specials[Math.floor(Math.random() * specials.length)];
    const num     = digits();

    return `${word}${special}${num}`;   // e.g. anura&@15
}

/**
 * Generate a unique Roll Number.
 * Format: 0601 + BRANCH + YY + 4-digit-random (1000-9999)
 * Example: 0601IT261066
 * Roll number is stored and treated as a STRING to preserve leading zeros.
 */
async function generateRollNumber(branch) {
    const year = new Date().getFullYear().toString().slice(-2); // last 2 digits e.g. "26"
    const prefix = `${COLLEGE_CODE}${branch}${year}`;

    const MAX_ATTEMPTS = 20;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // Random 4-digit number between 1000 and 9999 (inclusive)
        const random = Math.floor(Math.random() * 9000) + 1000;
        const candidate = `${prefix}${random}`;

        // Check uniqueness in DB
        const existing = await Student.findOne({ rollNumber: candidate });
        if (!existing) {
            return candidate;
        }
    }

    // Exhausted attempts — extremely unlikely but handle gracefully
    throw new Error('Could not generate a unique roll number after 20 attempts. Please try again.');
}


/**
 * Send approval email with credentials to the student.
 * Returns true on success, false on failure.
 */
async function sendApprovalEmail(student, rollNumber, tempPassword) {
    const portalUrl  = process.env.COLLEGE_PORTAL_URL || 'http://localhost:3050';
    const collegeName = process.env.COLLEGE_NAME || 'Indira Gandhi Engineering College, Sagar';

    try {
        await transporter.sendMail({
            from: `"${collegeName}" <${process.env.MAIL_USER}>`,
            to: student.email,
            subject: `Admission Approved — Your Login Credentials | ${collegeName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f9;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:#1a3c6e;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-.3px;">
        ${collegeName}
      </h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px;">
        Affiliated to RGPV Bhopal &nbsp;|&nbsp; College Code: 0601
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:15px;color:#1e293b;">
        Dear <strong>${student.fullName}</strong>,
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
        Congratulations! Your admission application has been
        <strong style="color:#16a34a;">approved</strong>. Your student account has been
        created. Please find your login credentials below.
      </p>

      <!-- Credentials Box -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:20px 24px;margin:0 0 24px;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">
          Your Login Credentials
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748b;width:160px;">Roll Number</td>
            <td style="padding:8px 0;font-size:18px;font-weight:700;color:#1a3c6e;letter-spacing:1px;">${rollNumber}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748b;">Temporary Password</td>
            <td style="padding:8px 0;font-size:18px;font-weight:700;color:#1a3c6e;letter-spacing:1px;">${tempPassword}</td>
          </tr>
        </table>
      </div>

      <!-- Warning -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:14px 18px;margin:0 0 24px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          <strong>Important:</strong> This is a system-generated temporary password.
          You will be required to change this password on your first login.
          Do not share your credentials with anyone.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${portalUrl}/student/login"
           style="display:inline-block;background:#1a3c6e;color:#fff;padding:12px 28px;text-decoration:none;border-radius:5px;font-size:14px;font-weight:600;">
          Login to Student Portal
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
        This is an automated email. Please do not reply.<br>
        ${collegeName} — Student Admission Portal
      </p>
    </div>
  </div>
</body>
</html>
            `
        });
        return true;
    } catch (err) {
        console.error('Approval Email Send Error:', err.message);
        return false;
    }
}


// ──────────────────────────────────────────────────────────────
// GET /master/login
// ──────────────────────────────────────────────────────────────
exports.GetLogin = (req, res) => {
    res.render('master/login', { errors: [], otpSent: false });
};


// POST /master/login — handled by authcontroller
const AuthController = require('./authcontroller');
exports.PostLogin = AuthController.PostMasterLogin;


// ──────────────────────────────────────────────────────────────
// GET /master/dashboard  →  Overview with stats + recent 10
// ──────────────────────────────────────────────────────────────
exports.GetDashboard = async (req, res) => {
    try {
        const [total, pending, approved, rejected, recentStudents] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: 'pending' }),
            Student.countDocuments({ status: 'approved' }),
            Student.countDocuments({ status: 'rejected' }),
            Student.find({}, {
                fullName: 1, branch: 1, status: 1, rollNumber: 1, createdAt: 1
            }).sort({ createdAt: -1 }).limit(10)
        ]);

        // Branch-wise breakdown for chart
        const branchStats = await Student.aggregate([
            { $group: { _id: '$branch', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.render('master/dashboard', {
            stats: { total, pending, approved, rejected },
            recentStudents,
            branchStats
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        req.flash('error_msg', 'Failed to load dashboard.');
        res.redirect('/master/login');
    }
};


// ──────────────────────────────────────────────────────────────
// GET /master/students  →  Full student management listing
// ──────────────────────────────────────────────────────────────
exports.GetStudentsList = async (req, res) => {
    try {
        const { search = '', branch = '', status = '', page = 1 } = req.query;
        const LIMIT = 15;
        const skip  = (parseInt(page) - 1) * LIMIT;

        // Build query filter
        const filter = {};
        if (branch)  filter.branch = branch;
        if (status)  filter.status = status;
        if (search) {
            const re = new RegExp(search.trim(), 'i');
            filter.$or = [
                { fullName:   re },
                { email:      re },
                { rollNumber: re }
            ];
        }

        const [students, totalCount] = await Promise.all([
            Student.find(filter, {
                fullName: 1, email: 1, branch: 1,
                status: 1, rollNumber: 1, createdAt: 1
            }).sort({ createdAt: -1 }).skip(skip).limit(LIMIT),
            Student.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalCount / LIMIT);

        res.render('master/students_list', {
            students,
            totalCount,
            totalPages,
            currentPage: parseInt(page),
            search,
            branch,
            status,
            BRANCHES: ['IT', 'CE', 'ME', 'ECE', 'EE']
        });

    } catch (error) {
        console.error('Students List Error:', error);
        req.flash('error_msg', 'Failed to load students list.');
        res.redirect('/master/dashboard');
    }
};


// ──────────────────────────────────────────────────────────────
// GET /master/student/:id  →  View full student details
// ──────────────────────────────────────────────────────────────
exports.GetStudentDetail = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            req.flash('error_msg', 'Student not found.');
            return res.redirect('/master/students');
        }

        res.render('master/view_student', { student });

    } catch (error) {
        console.error('View Student Error:', error);
        req.flash('error_msg', 'Failed to load student details.');
        res.redirect('/master/students');
    }
};


// ──────────────────────────────────────────────────────────────
// POST /master/student/:id/approve  →  Approve student
// ──────────────────────────────────────────────────────────────
exports.PostApproveStudent = async (req, res) => {
    const returnUrl = req.body.returnUrl || req.headers.referer || '/master/students';

    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            req.flash('error_msg', 'Student not found.');
            return res.redirect(returnUrl);
        }

        // ── Idempotency checks ─────────────────────────────────
        if (student.status === 'approved') {
            req.flash('error_msg', `${student.fullName} is already approved.`);
            return res.redirect(returnUrl);
        }

        if (student.status === 'rejected') {
            req.flash('error_msg', `${student.fullName} was rejected. Cannot approve a rejected application.`);
            return res.redirect(returnUrl);
        }

        // ── Generate Roll Number (format: 0601BRANCH_YY_RAND) ──
        const rollNumber = await generateRollNumber(student.branch);

        // ── Generate a random temporary password ───────────────
        const tempPassword   = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // ── Update student in DB ───────────────────────────────
        student.status              = 'approved';
        student.rollNumber          = rollNumber;
        student.password            = hashedPassword;
        student.isTemporaryPassword = true;
        student.rejectionReason     = null;
        student.emailNotified       = false;

        // ── Send approval email ───────────────────────────────
        let emailSent = false;
        try {
            emailSent = await sendApprovalEmail(student, rollNumber, tempPassword);
        } catch (mailErr) {
            console.error('Approval Email Send Exception:', mailErr.message);
            emailSent = false;
        }

        student.emailNotified = emailSent;
        await student.save();

        if (emailSent) {
            req.flash('success_msg',
                `✅ ${student.fullName} approved! Roll Number: ${rollNumber}. Login credentials sent to ${student.email}.`
            );
        } else {
            req.flash('success_msg',
                `⚠️ ${student.fullName} approved! Roll Number: ${rollNumber}. (Note: Email delivery failed or SMTP timed out. Credentials can be provided manually).`
            );
        }

        return res.redirect(returnUrl);

    } catch (error) {
        console.error('Approve Student Error:', error);

        if (error.code === 11000) {
            req.flash('error_msg', 'Roll number conflict. Please try approving again.');
        } else {
            req.flash('error_msg', `Failed to approve student: ${error.message}`);
        }

        return res.redirect(returnUrl);
    }
};


// ──────────────────────────────────────────────────────────────
// POST /master/student/:id/reject  →  Reject student
// ──────────────────────────────────────────────────────────────
exports.PostRejectStudent = async (req, res) => {
    const returnUrl = req.body.returnUrl || req.headers.referer || '/master/students';

    try {
        const { rejectionReason } = req.body;
        const student = await Student.findById(req.params.id);

        if (!student) {
            req.flash('error_msg', 'Student not found.');
            return res.redirect(returnUrl);
        }

        if (student.status !== 'pending') {
            req.flash('error_msg', `Cannot reject ${student.fullName}. Status is already: ${student.status}.`);
            return res.redirect(returnUrl);
        }

        student.status          = 'rejected';
        student.rejectionReason = rejectionReason ? rejectionReason.trim() : 'No reason provided.';

        await student.save();

        req.flash('success_msg', `❌ ${student.fullName}'s application has been rejected.`);
        return res.redirect(returnUrl);

    } catch (error) {
        console.error('Reject Student Error:', error);
        req.flash('error_msg', 'Failed to reject student. Please try again.');
        return res.redirect(returnUrl);
    }
};


// ──────────────────────────────────────────────────────────────
// POST /master/logout
// ──────────────────────────────────────────────────────────────
exports.PostLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
        res.redirect('/master/login');
    });
};
