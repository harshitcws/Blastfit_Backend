const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Photo = require("../models/Photo");

// ✅ CORRECT PATH - aapke existing auth middleware ko import karein
const { protect } = require("../middleware/authMiddleware"); // Ye line change karein

// Ensure folder exists
const uploadPath = path.join(__dirname, "../public/usersprogress");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create user-specific folder
        const userFolder = path.join(uploadPath, req.user._id.toString());
        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder, { recursive: true });
        }
        cb(null, userFolder);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + ext);
    },
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// ---------------------------
// Upload Progress Photo (Protected)
// ---------------------------
router.post("/upload", protect, upload.single("photo"), async (req, res) => {
    try {
        console.log("Upload request from user:", req.user._id);
        console.log("Upload request body:", req.body);
        
        const { date, type } = req.body;
        const userId = req.user._id;

        if (!req.file || !date || !type) {
            return res.status(400).json({ 
                success: false,
                message: "Missing file, date, or type" 
            });
        }

        console.log("File received:", req.file.filename);

        // User-specific file URL
        const fileUrl = `/usersprogress/${userId}/${req.file.filename}`;

        // Upsert - update if exists, create if not
        const updatedPhoto = await Photo.findOneAndUpdate(
            { userId, date, type },
            { 
                url: fileUrl,
                createdAt: new Date()
            },
            { 
                upsert: true, 
                new: true 
            }
        );

        console.log("Photo saved to DB:", updatedPhoto);

        res.json({
            success: true,
            message: "Photo uploaded successfully",
            photo: {
                url: fileUrl,
                date,
                type
            }
        });
    } catch (error) {
        console.log("Upload error:", error);
        res.status(500).json({ 
            success: false,
            message: "Upload failed", 
            error: error.message 
        });
    }
});

// ---------------------------
// Get USER'S progress photos grouped by date (Protected)
// ---------------------------
router.get("/", protect, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("Fetching photos for user:", userId);
        
        const photos = await Photo.find({ userId }).sort({ date: -1, type: 1 });
        
        // Group by date
        const photosByDate = {};
        photos.forEach(photo => {
            if (!photosByDate[photo.date]) {
                photosByDate[photo.date] = {};
            }
            photosByDate[photo.date][photo.type] = photo.url;
        });

        console.log("Photos found for user:", userId, "-", Object.keys(photosByDate).length, "dates");
        
        res.json({
            success: true,
            photos: photosByDate
        });
    } catch (err) {
        console.log("Get photos error:", err);
        res.status(500).json({ 
            success: false,
            message: "Unable to load photos", 
            error: err.message 
        });
    }
});

// Get user's photos for specific date
router.get("/date/:date", protect, async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user._id;
        
        console.log("Fetching photos for date:", date, "user:", userId);
        
        const photos = await Photo.find({ userId, date });
        
        const photoData = {};
        photos.forEach(photo => {
            photoData[photo.type] = photo.url;
        });

        res.json({
            success: true,
            photos: photoData
        });
    } catch (err) {
        console.log("Get photos by date error:", err);
        res.status(500).json({ 
            success: false,
            message: "Unable to load photos", 
            error: err.message 
        });
    }
});

// Delete user's photo
router.delete("/:date/:type", protect, async (req, res) => {
    try {
        const { date, type } = req.params;
        const userId = req.user._id;
        
        console.log("Deleting photo for user:", userId, "date:", date, "type:", type);
        
        const result = await Photo.findOneAndDelete({ userId, date, type });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Photo not found"
            });
        }

        res.json({
            success: true,
            message: "Photo deleted successfully"
        });
    } catch (err) {
        console.log("Delete photo error:", err);
        res.status(500).json({
            success: false,
            message: "Unable to delete photo",
            error: err.message
        });
    }
});

module.exports = router;