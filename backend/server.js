require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post('/api/send-whatsapp-otp', async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    try {
        // According to Twilio API docs for WhatsApp Sandbox
        const message = await client.messages.create({
            from: 'whatsapp:+14155238886', // Twilio sandbox number
            to: `whatsapp:+91${phone}`,
            body: `Your OTP for login is: ${otp}. Do not share this code.`
        });

        console.log(`WhatsApp OTP sent successfully to ${phone}: ${message.sid}`);
        res.status(200).json({ success: true, messageSid: message.sid });
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Twilio WhatsApp backend running on port ${PORT}`);
});
