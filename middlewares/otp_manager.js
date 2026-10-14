const nodemailer = require("nodemailer");
const crypto = require("crypto");
const otp_sender = require("../model/otp");
const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }

});


// Generate OTP hash
function hashOTP(otp) {

    return crypto
        .createHmac('sha256', process.env.OTP_SECRET)
        .update(otp)
        .digest('hex');

}


// Send OTP
async function OtpSender(email) {

    try {

        // Generate 6 digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        console.log(`[AUTH] Master Login OTP for ${email}: ${otp}`);

        // Hash OTP before storing
        const hashedOTP = hashOTP(otp);

        // Set expiration time (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);


        // Store OTP (replace previous OTP if exists)
        await otp_sender.findOneAndUpdate(

            { email },

            {
                email,
                otp: hashedOTP,
                attempts: 0,
                expiresAt
            },

            {
                upsert: true,
                returnDocument: 'after',
                runValidators: true
            }

        );


        // Send email
        await transporter.sendMail({

            from: process.env.MAIL_USER,
            to: email,
            subject: "Master Login Verification OTP",
            html: `
                <h2>Master Login Verification</h2>
                <p>Your login OTP is:</p>
                <h1>${otp}</h1>
                <p>This OTP is valid for 10 minutes.</p>
                <p>Do not share this OTP with anyone.</p>
            `

        });


        return true;


    } catch (error) {

        console.log("OTP Sending Error:", error);
        // Remove pending OTP if sending failed
        await otp_sender.deleteOne({ email }).catch(console.error);
        return false;

    }

}


// Verify OTP hash
function VerifyOTP(inputOTP, storedHash) {
    const inputHash = Buffer.from(hashOTP(inputOTP), 'hex');
    const databaseHash = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(inputHash, databaseHash);

}


module.exports = {
    OtpSender,
    VerifyOTP
};