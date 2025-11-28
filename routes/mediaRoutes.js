const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'exercises'));
  },
  filename: (req, file, cb) => {
    //const uniqueName = Date.now() + '-' + file.originalname;
    //cb(null, uniqueName);
    cb(null, file.originalname); // Use original name for simplicity
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `/exercises/${req.file.filename}`;
  res.json({ url: fileUrl });
});

module.exports = router;
