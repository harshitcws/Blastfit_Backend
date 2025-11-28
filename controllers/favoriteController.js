const User = require('../models/user');
const Exercise = require('../models/exercise');

// Add exercise to favorites
exports.addFavorite = async (req, res) => {
  try {
    const { exerciseId } = req.params;

    // Validate exercise exists
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    // Add to user's favorites if not already added
    const user = await User.findById(req.user._id);
    if (user.favorites.includes(exerciseId)) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    user.favorites.push(exerciseId);
    await user.save();

    res.json({ message: 'Added to favorites', favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const user = await User.findById(req.user._id);
    user.favorites = user.favorites.filter(fav => fav.toString() !== exerciseId);
    await user.save();

    res.json({ message: 'Removed from favorites', favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all favorites
exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
