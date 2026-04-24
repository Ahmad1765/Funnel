const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subject, html, message } = req.body || {};

    if (!html && !message) {
        return res.status(400).json({ error: 'Missing message' });
    }

    try {
        await transporter.sendMail({
            from: `"Wrinkles Quiz" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: subject || 'Nieuwe quizvoltooiing – Wrinkles Quiz',
            html: html || `<pre>${message}</pre>`,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Mail error:', err.message);
        return res.status(500).json({ error: 'Failed to send email' });
    }
};
