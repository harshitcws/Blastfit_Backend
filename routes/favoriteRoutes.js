const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addFavorite, removeFavorite, getFavorites } = require('../controllers/favoriteController');

router.post('/addFavorite/:exerciseId', protect, addFavorite);
router.delete('/removeFavorite/:exerciseId', protect, removeFavorite);
router.get('/getFavorites', protect, getFavorites);

module.exports = router;
