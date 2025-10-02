import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔹 Multer setup — store files temporarily in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔹 Root route
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// 🔹 Handle file uploads
app.post(
  '/upload',
  upload.fields([
    { name: 'business_docs', maxCount: 1 },
    { name: 'id_file', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        full_name,
        email,
        business_name,
        business_doc_type,
        id_doc_type,
      } = req.body;

      // 🧩 Validate basic fields
      if (!full_name || !email || !business_doc_type || !id_doc_type) {
        return res
          .status(400)
          .json({ success: false, message: 'Missing required fields' });
      }

      const files = req.files || {};
      if (!files.business_docs || !files.id_file) {
        return res
          .status(400)
          .json({ success: false, message: 'Missing files' });
      }

      // 🔗 Forward files to Cloudways PHP endpoint
      const CLOUDWAYS_URL = 'https://asterclaim.io/api/upload.php'; // ⬅️ Replace with your actual Cloudways URL

      const formData = new FormData();
      formData.append('full_name', full_name);
      formData.append('email', email);
      formData.append('business_name', business_name || '');
      formData.append('business_doc_type', business_doc_type);
      formData.append('id_doc_type', id_doc_type);

      // 🗂️ Attach files
      formData.append(
        'business_docs',
        files.business_docs[0].buffer,
        files.business_docs[0].originalname
      );
      formData.append(
        'id_file',
        files.id_file[0].buffer,
        files.id_file[0].originalname
      );

      // 🌐 Send to Cloudways PHP script
      const cloudRes = await fetch(CLOUDWAYS_URL, {
        method: 'POST',
        body: formData,
      });
      const cloudData = await cloudRes.json();

      // 🔎 Log Cloudways response
      console.log('✅ Saved to Cloudways:', cloudData);

      // 🕓 Timestamp
      const timestamp = new Date().toLocaleString();

      // 📩 Build Telegram message
      const message = `
📥 *New Submission Received:*

👤 Name: ${full_name}
📧 Email: ${email}
🏢 Business: ${business_name || 'N/A'}
📄 Doc Type: ${business_doc_type}
🪪 ID Type: ${id_doc_type}
⏰ ${timestamp}

📎 [Business Document](${cloudData?.urls?.business_docs || 'N/A'})
🪪 [ID File](${cloudData?.urls?.id_file || 'N/A'})
`;

      // 🚀 Send Telegram notification
      const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      // ✅ Respond to frontend
      res.json({
        success: true,
        message: 'Files uploaded, saved on Cloudways, and Telegram notified.',
      });
    } catch (err) {
      console.error('❌ Upload error:', err);
      res
        .status(500)
        .json({ success: false, message: 'Server error. Please try again.' });
    }
  }
);

// 🔹 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
