const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },

    otp: {
        type: String,
        required: true
    },

    attempts: {
        type: Number,
        default: 0
    },

    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    }

});

module.exports = mongoose.model('otp_sender', otpSchema);