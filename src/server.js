import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Use multer to handle file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Root route serves index.html
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// POST /upload route
app.post('/upload', upload.fields([
  { name: 'business_docs', maxCount: 1 },
  { name: 'id_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { full_name, email, business_name, business_doc_type, id_doc_type } = req.body;
    const files = req.files || {};
    const timestamp = new Date().toLocaleString();

    // Build message text
    const message = `📥 *New Submission Received:*

👤 Name: ${full_name}
📧 Email: ${email}
🏢 Business: ${business_name || 'N/A'}
📄 Doc Type: ${business_doc_type}
🪪 ID Type: ${id_doc_type}
⏰ ${timestamp}`;

    // Send Telegram notification
    const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    // (Optional) Here you can also store files in S3 or DB

    res.json({ success: true, message: 'Submission received and Telegram notified.' });
  } catch (err) {
    console.error('Error handling upload:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
