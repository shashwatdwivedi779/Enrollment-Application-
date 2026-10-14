const Student = require('../model/forms');

// ──────────────────────────────────────────────────────────────
// GET /  →  College homepage
// ──────────────────────────────────────────────────────────────
exports.GetHome = (req, res) => {
    res.render('home');
};


// ──────────────────────────────────────────────────────────────
// GET /register  →  Show registration form
// ──────────────────────────────────────────────────────────────
exports.GetRegister = (req, res) => {
    res.render('register', { errors: [], formData: {} });
};


// ──────────────────────────────────────────────────────────────
// POST /register  →  Save student registration
// ──────────────────────────────────────────────────────────────
exports.PostRegister = async (req, res) => {
    const {
        fullName, dob, gender, fatherName, motherName,
        aadhar, email, phone, address, city, pincode,
        branch, semesterYear, jeeScore, board12, roll12, grade12, grade10
    } = req.body;

    const errors = [];

    // ── Basic required field validation ───────────────────────
    if (!fullName || !dob || !gender || !fatherName || !motherName ||
        !aadhar  || !email || !phone || !address || !city || !pincode ||
        !branch  || !semesterYear || !board12 || !roll12 || !grade12 || !grade10) {
        errors.push('All required fields must be filled in.');
    }

    // Email format
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        errors.push('Please enter a valid email address.');
    }

    // Phone: exactly 10 digits
    if (phone && !/^[0-9]{10}$/.test(phone)) {
        errors.push('Phone number must be exactly 10 digits.');
    }

    // Aadhar: exactly 12 digits
    if (aadhar && !/^[0-9]{12}$/.test(aadhar)) {
        errors.push('Aadhar number must be exactly 12 digits.');
    }

    // Pincode: exactly 6 digits
    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
        errors.push('Pincode must be exactly 6 digits.');
    }

    if (errors.length > 0) {
        return res.status(422).render('register', { errors, formData: req.body });
    }

    try {
        // ── Check for duplicate email ──────────────────────────
        const existingEmail = await Student.findOne({ email: email.trim().toLowerCase() });
        if (existingEmail) {
            errors.push('An application with this email address already exists.');
            return res.status(422).render('register', { errors, formData: req.body });
        }

        // ── Check for duplicate Aadhar ─────────────────────────
        const existingAadhar = await Student.findOne({ aadhar: aadhar.trim() });
        if (existingAadhar) {
            errors.push('An application with this Aadhar number already exists.');
            return res.status(422).render('register', { errors, formData: req.body });
        }

        // ── Save student (status defaults to 'pending') ────────
        const student = new Student({
            fullName:    fullName.trim(),
            dob,
            gender,
            fatherName:  fatherName.trim(),
            motherName:  motherName.trim(),
            aadhar:      aadhar.trim(),
            email:       email.trim().toLowerCase(),
            phone:       phone.trim(),
            address:     address.trim(),
            city:        city.trim(),
            pincode:     pincode.trim(),
            branch,
            semesterYear: semesterYear.trim(),
            jeeScore:    jeeScore || null,
            board12,
            roll12:      roll12.trim(),
            grade12:     parseFloat(grade12),
            grade10:     parseFloat(grade10),
        });

        await student.save();

        return res.redirect('/register/success');

    } catch (error) {
        console.error('Registration Error:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            errors.push(`A registration with this ${field} already exists.`);
            return res.status(422).render('register', { errors, formData: req.body });
        }

        if (error.name === 'ValidationError') {
            Object.values(error.errors).forEach(e => errors.push(e.message));
            return res.status(422).render('register', { errors, formData: req.body });
        }

        errors.push('Something went wrong. Please try again.');
        return res.status(500).render('register', { errors, formData: req.body });
    }
};


// ──────────────────────────────────────────────────────────────
// GET /register/success  →  Show success page
// ──────────────────────────────────────────────────────────────
exports.GetRegisterSuccess = (req, res) => {
    res.render('register_success');
};