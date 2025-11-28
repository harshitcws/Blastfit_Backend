const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  profile,
  deleteUser,
  send_otp,
  verifiedLogin,
  otp_verify,
  change_password,
  forget_password,
  reset_password,
  resend_otp, // ✅ fixed name
  update_user,
  updateFitnessProfile,
  getAllUsers,        // Add this
  deleteUserById  ,
  updateUserById,autoverfied,appleLogin,adminlogin,changeadminPassword,
  searchUsers
} = require('../controllers/authController');
const upload = require('../middleware/upload');

console.log('>>> typeof profile:', typeof profile); // ✅ Should print: 'function'
console.log('>>> typeof deleteUser:', typeof deleteUser); // ✅ Should print: 'function'

router.post('/register', register);
router.post('/login', login);
router.post('/adminlogin', adminlogin);
router.post('/changeadminPassword', changeadminPassword);

router.post('/verifiedLogin', verifiedLogin);

router.get('/profile', protect, profile);
router.delete('/delete', protect, deleteUser);
router.post('/otp_verify', otp_verify);
router.post('/autoverfied', autoverfied);
router.post('/appleLogin', appleLogin);

router.post('/forget_password', forget_password);
router.post('/reset_password', reset_password);
router.post('/change_password', protect, change_password);
router.post('/resend_otp', resend_otp); // ✅ fixed route and name
// router.patch('/update', protect, update_user);
router.patch('/update', protect, upload.single('profilePicture'), update_user);
router.put('/update-profile/:userid',protect, updateFitnessProfile); // update fitness related data such as fitness goal etc..
router.post('/send-otp/:userId', protect, send_otp);
router.get('/all', protect, getAllUsers); // Get all users (Admin only)
router.get('/search', protect, searchUsers); // Search users by name/email (for sharing)
router.put('/updateUserById/:userId', protect, updateUserById);
router.delete('/deleteUserById/:userId', protect, deleteUserById);
module.exports = router;
