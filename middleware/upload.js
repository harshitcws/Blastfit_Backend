const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/users folder exists
const uploadDir = path.join(__dirname, '../public/profileimg');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const username = req.user.name?.replace(/\s+/g, '_') || req.user._id;
    cb(null, `${username}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
