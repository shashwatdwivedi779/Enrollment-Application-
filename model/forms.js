const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        // ── Personal Information ───────────────────────────────
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },

        dob: {
            type: Date,
            required: [true, 'Date of birth is required'],
        },

        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: [true, 'Gender is required'],
        },

        fatherName: {
            type: String,
            required: [true, 'Father\'s name is required'],
            trim: true,
        },

        motherName: {
            type: String,
            required: [true, 'Mother\'s name is required'],
            trim: true,
        },

        aadhar: {
            type: String,
            required: [true, 'Aadhar number is required'],
            unique: true,
            match: [/^[0-9]{12}$/, 'Aadhar must be exactly 12 digits'],
        },

        // ── Contact Information ────────────────────────────────
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },

        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^[0-9]{10}$/, 'Phone must be exactly 10 digits'],
        },

        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },

        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
        },

        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            match: [/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'],
        },

        // ── Academic Information ───────────────────────────────
        branch: {
            type: String,
            enum: ['IT', 'ME', 'CE', 'ECE', 'EE'],
            required: [true, 'Branch is required'],
        },

        semesterYear: {
            type: String,
            required: [true, 'Semester/Year is required'],
            trim: true,
        },

        jeeScore: {
            type: Number,
            min: [0, 'JEE score cannot be negative'],
            max: [300, 'JEE score cannot exceed 300'],
        },

        // Class 12th
        board12: {
            type: String,
            enum: ['MPBSE', 'CBSE', 'ICSE', 'Other'],
            required: [true, 'Board (12th) is required'],
        },

        roll12: {
            type: String,
            required: [true, 'Roll number (12th) is required'],
            trim: true,
        },

        grade12: {
            type: Number,
            min: [0, 'Grade cannot be negative'],
            max: [100, 'Grade cannot exceed 100'],
            required: [true, 'Percentage (12th) is required'],
        },

        // Class 10th
        grade10: {
            type: Number,
            min: [0, 'Grade cannot be negative'],
            max: [100, 'Grade cannot exceed 100'],
            required: [true, 'Percentage (10th) is required'],
        },

        // ── Approval / Status ──────────────────────────────────
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        rejectionReason: {
            type: String,
            trim: true,
            default: null,
        },

        // ── Login Credentials (set only on approval) ───────────
        rollNumber: {
            type: String,
            trim: true,
            index: {
                unique: true,
                partialFilterExpression: { rollNumber: { $type: 'string' } }
            },
            default: null,
        },

        password: {
            type: String,  // bcrypt hash
            default: null,
        },

        isTemporaryPassword: {
            type: Boolean,
            default: true, // student must change password on first login
        },

        // Track if approval email was successfully delivered
        emailNotified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;