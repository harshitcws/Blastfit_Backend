const User = require('../models/user');
const generateToken = require('../utils/generateToken');
const mailer = require('nodemailer')
const AppleUser = require('../models/AppleUser');
const { verifyAppleIdentityToken } = require('../utils/appleUtils');
const { sendMail } = require('../utils/sendMail');
const upload = require('../middleware/upload');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  console.log('REGISTER HIT', req.body);
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      token: generateToken(user._id, req.headers['x-device'] || 'web'), // Use device info from headers
      msg: 'Registration is successfull.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
// update the user profile with fitness data...
exports.updateFitnessProfile = async (req, res) => {
  const { userid } = req.params;
  console.log('updating fitness profile data:', userid, req.body);
  if (req.user._id.toString() !== userid) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(userid, req.body, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};

// send otp after the user fitness profile completes:
exports.send_otp = async (req, res) => {
  console.log('💡 sendOtp invoked with userId:', req.params.userId);

  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    console.log('💡 Found user:', user ? user._id : 'none');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Example OTP logic
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    console.log('💡 OTP saved:', otp);

    await sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Verify your email- LiftVerse Pro',
        html: `<h1>Welcome to LiftVerse Pro</h1>
               <p>Thank you for registering. Please verify your email by entering the OTP given below:</p>
               <h2>${otp}</h2>
               <p>If you did not register, please ignore this email.</p>
               <p>Best regards,</p>
               <p>LiftVerse Pro Team</p>`,
          }
    );
    
    console.log('💡 Mail sent to:', user.email);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('❌ sendOtp error:', err);
    res.status(500).json({ message: 'OTP send failed', error: err.message });
  }
};
  exports.autoverfied = async (req, res) => {
    const { email } = req.body;
    console.log('OTP VERIFY HIT', req.body);
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
     
  
      const now = new Date();
      
  
      // OTP is valid
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
  
      res.status(200).json({ 
        user:user,
        token: generateToken(user._id),
        message: 'OTP verified successfully' 
      });
  
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  };
// ============================================
// UPDATED APPLE LOGIN FUNCTION - COMPLETE FIX
// ============================================

// exports.appleLogin = async (req, res) => {
//   const { identityToken, appleUserId, email, fullName, givenName, familyName } = req.body;

//   if (!identityToken || !appleUserId) {
//     return res.status(400).json({ message: 'Invalid Apple login data.' });
//   }

//   try {
//     console.log('🍎 Apple Login Request:', { appleUserId, email, givenName, familyName });

//     // ========================
//     // STEP 1: Verify Token
//     // ========================
//     const verifiedPayload = await verifyAppleIdentityToken(identityToken);
//     if (!verifiedPayload) {
//       return res.status(401).json({ message: 'Apple identity verification failed.' });
//     }

//     // ========================
//     // STEP 2: Find or Create AppleUser
//     // ========================
//     let appleUser = await AppleUser.findOne({ appleUserId });

//     if (!appleUser) {
//       // ✅ First time login - Save all data from Apple
//       console.log('🆕 Creating new AppleUser');
      
//       appleUser = new AppleUser({
//         appleUserId,
//         identityToken,
//         email: email || "", // Apple provides email only first time
//         fullName: {
//           givenName: givenName || "",
//           familyName: familyName || ""
//         },
//         isVerified: true
//       });
//       await appleUser.save();
//       console.log('✅ AppleUser saved:', appleUser);
//     } else {
//       // ✅ Subsequent login - Update token only
//       console.log('📝 Updating existing AppleUser');
      
//       appleUser.identityToken = identityToken;
//       appleUser.isVerified = true;
      
//       // ⚠️ IMPORTANT: Only update email/name if they were empty before
//       // This preserves the original data from first login
//       if (email && !appleUser.email) {
//         appleUser.email = email;
//       }
//       if (givenName && !appleUser.fullName.givenName) {
//         appleUser.fullName.givenName = givenName;
//       }
//       if (familyName && !appleUser.fullName.familyName) {
//         appleUser.fullName.familyName = familyName;
//       }
      
//       await appleUser.save();
//       console.log('✅ AppleUser updated:', appleUser);
//     }

//     // ========================
//     // STEP 3: Get Email (Current or Saved)
//     // ========================
//     let userEmail = email || appleUser.email;

//     if (!userEmail) {
//       console.log('❌ No email available from Apple');
//       return res.status(400).json({ 
//         noUser: true, 
//         message: 'Email not available from Apple. Cannot proceed.',
//         appleUserId: appleUserId
//       });
//     }

//     console.log('📧 Using email:', userEmail);

//     // ========================
//     // STEP 4: Check User Collection
//     // ========================
//     let user = await User.findOne({ email: userEmail });

//     if (!user) {
//       // ✅ User doesn't exist - Return data for signup
//       console.log('🆕 User not found, returning data for signup');
      
//       const fullNameString = `${appleUser.fullName?.givenName || ""} ${appleUser.fullName?.familyName || ""}`.trim();
      
//       return res.status(200).json({ 
//         noUser: true, 
//         email: userEmail, 
//         fullName: {
//           givenName: appleUser.fullName?.givenName || "",
//           familyName: appleUser.fullName?.familyName || ""
//         },
//         name: fullNameString || "Apple User",
//         appleUserId: appleUserId
//       });
//     }

//     // ========================
//     // STEP 5: User Exists - Update Name if Needed
//     // ========================
//     console.log('✅ User found:', user.email);
    
//     const appleGivenName = appleUser.fullName?.givenName || "";
//     const appleFamilyName = appleUser.fullName?.familyName || "";
//     const fullNameFromApple = `${appleGivenName} ${appleFamilyName}`.trim();
    
//     // Update name only if it's empty or "new user"
//     if (fullNameFromApple && (!user.name || user.name.trim() === "" || user.name.toLowerCase() === "new user")) {
//       user.name = fullNameFromApple;
//       console.log('📝 Updated user name to:', fullNameFromApple);
//     }

//     // ========================
//     // STEP 6: Mark User as Verified
//     // ========================
//     if (!user.isVerified) {
//       user.isVerified = true;
//       console.log('✅ User marked as verified');
//     }

//     await user.save();

//     // ========================
//     // STEP 7: Generate Token & Send Response
//     // ========================
//     const token = generateToken(user._id, req.headers['x-device'] || 'web');
    
//     console.log('🎉 Login successful for:', user.email);
    
//     return res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       isVerified: user.isVerified,
//       token,
//       message: 'Login successful'
//     });

//   } catch (err) {
//     console.error('❌ Apple login error:', err);
//     return res.status(500).json({ 
//       message: 'Server Error', 
//       error: err.message 
//     });
//   }
// };

// ============================================
// UPDATED APPLE LOGIN FUNCTION - COMPLETE FIX
// ============================================

// exports.appleLogin = async (req, res) => {
//   const { identityToken, appleUserId, email, fullName, givenName, familyName } = req.body;

//   if (!identityToken || !appleUserId) {
//     return res.status(400).json({ message: 'Invalid Apple login data.' });
//   }

//   try {
//     console.log('🍎 Apple Login Request:', { appleUserId, email, givenName, familyName });

//     // ========================
//     // STEP 1: Verify Token
//     // ========================
//     const verifiedPayload = await verifyAppleIdentityToken(identityToken);
//     if (!verifiedPayload) {
//       return res.status(401).json({ message: 'Apple identity verification failed.' });
//     }

//     // ========================
//     // STEP 2: Find or Create AppleUser
//     // ========================
//     let appleUser = await AppleUser.findOne({ appleUserId });

//     if (!appleUser) {
//       // ✅ First time login - Save all data from Apple
//       console.log('🆕 Creating new AppleUser');
      
//       appleUser = new AppleUser({
//         appleUserId,
//         identityToken,
//         email: email || "", // Apple provides email only first time
//         fullName: {
//           givenName: givenName || "",
//           familyName: familyName || ""
//         },
//         isVerified: true
//       });
//       await appleUser.save();
//       console.log('✅ AppleUser saved:', appleUser);
//     } else {
//       // ✅ Subsequent login - Update token only
//       console.log('📝 Updating existing AppleUser');
      
//       appleUser.identityToken = identityToken;
//       appleUser.isVerified = true;
      
//       // ⚠️ IMPORTANT: Only update email/name if they were empty before
//       // This preserves the original data from first login
//       if (email && !appleUser.email) {
//         appleUser.email = email;
//       }
//       if (givenName && !appleUser.fullName.givenName) {
//         appleUser.fullName.givenName = givenName;
//       }
//       if (familyName && !appleUser.fullName.familyName) {
//         appleUser.fullName.familyName = familyName;
//       }
      
//       await appleUser.save();
//       console.log('✅ AppleUser updated:', appleUser);
//     }

//     // ========================
//     // STEP 3: Get Email (Current or Saved)
//     // ========================
//     let userEmail = email || appleUser.email;

//     // ✅ CRITICAL FIX: Check if email exists in identityToken
//     if (!userEmail) {
//       console.log('⚠️ No email from Apple request, checking token...');
      
//       // Decode token to extract email (Apple puts it in JWT)
//       try {
//         const tokenParts = identityToken.split('.');
//         if (tokenParts.length === 3) {
//           const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
//           if (payload.email) {
//             userEmail = payload.email;
            
//             // ✅ Update AppleUser with recovered email
//             appleUser.email = userEmail;
//             await appleUser.save();
            
//             console.log('✅ Email recovered from token:', userEmail);
//           }
//         }
//       } catch (decodeError) {
//         console.error('❌ Token decode failed:', decodeError);
//       }
//     }

//     if (!userEmail) {
//       console.log('❌ No email available from Apple');
//       return res.status(400).json({ 
//         noUser: true, 
//         message: 'Email not available from Apple. Cannot proceed.',
//         appleUserId: appleUserId
//       });
//     }

//     console.log('📧 Using email:', userEmail);

//     // ========================
//     // STEP 4: Check User Collection
//     // ========================
//     let user = await User.findOne({ email: userEmail });

//     if (!user) {
//       // ✅ User doesn't exist - Return data for signup
//       console.log('🆕 User not found, returning data for signup');
      
//       const fullNameString = `${appleUser.fullName?.givenName || ""} ${appleUser.fullName?.familyName || ""}`.trim();
      
//       return res.status(200).json({ 
//         noUser: true, 
//         email: userEmail, 
//         fullName: {
//           givenName: appleUser.fullName?.givenName || "",
//           familyName: appleUser.fullName?.familyName || ""
//         },
//         name: fullNameString || "Apple User",
//         appleUserId: appleUserId
//       });
//     }

//     // ========================
//     // STEP 5: User Exists - Update Name if Needed
//     // ========================
//     console.log('✅ User found:', user.email);
    
//     const appleGivenName = appleUser.fullName?.givenName || "";
//     const appleFamilyName = appleUser.fullName?.familyName || "";
//     const fullNameFromApple = `${appleGivenName} ${appleFamilyName}`.trim();
    
//     // Update name only if it's empty or "new user"
//     if (fullNameFromApple && (!user.name || user.name.trim() === "" || user.name.toLowerCase() === "new user")) {
//       user.name = fullNameFromApple;
//       console.log('📝 Updated user name to:', fullNameFromApple);
//     }

//     // ========================
//     // STEP 6: Mark User as Verified
//     // ========================
//     if (!user.isVerified) {
//       user.isVerified = true;
//       console.log('✅ User marked as verified');
//     }

//     await user.save();

//     // ========================
//     // STEP 7: Generate Token & Send Response
//     // ========================
//     const token = generateToken(user._id, req.headers['x-device'] || 'web');
    
//     console.log('🎉 Login successful for:', user.email);
    
//     return res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       isVerified: user.isVerified,
//       token,
//       message: 'Login successful'
//     });

//   } catch (err) {
//     console.error('❌ Apple login error:', err);
//     return res.status(500).json({ 
//       message: 'Server Error', 
//       error: err.message 
//     });
//   }
// };
// ============================================
// COMPLETE APPLE LOGIN - ALL CASES COVERED
// ============================================

exports.appleLogin = async (req, res) => {
  const { identityToken, appleUserId, email, fullName, givenName, familyName } = req.body;

  if (!identityToken || !appleUserId) {
    return res.status(400).json({ message: 'Invalid Apple login data.' });
  }

  try {
    console.log('🍎 Apple Login Request:', { appleUserId, email, givenName, familyName });

    // ========================
    // STEP 0: Extract Email from Token ALWAYS
    // ========================
    let extractedEmail = email;
    let extractedGivenName = givenName;
    let extractedFamilyName = familyName;

    try {
      const tokenParts = identityToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('🔍 Token payload:', payload);
        
        // ✅ Email always extract from token (highest priority)
        if (payload.email && !extractedEmail) {
          extractedEmail = payload.email;
          console.log('✅ Email extracted from token:', extractedEmail);
        }
      }
    } catch (decodeError) {
      console.error('❌ Token decode failed:', decodeError.message);
    }

    // ========================
    // STEP 1: Verify Token
    // ========================
    const verifiedPayload = await verifyAppleIdentityToken(identityToken);
    if (!verifiedPayload) {
      return res.status(401).json({ message: 'Apple identity verification failed.' });
    }

    // ========================
    // STEP 2: Find or Create AppleUser
    // ========================
    let appleUser = await AppleUser.findOne({ appleUserId });

    if (!appleUser) {
      // ✅ First time - Save all available data
      console.log('🆕 Creating new AppleUser');
      
      appleUser = new AppleUser({
        appleUserId,
        identityToken,
        email: extractedEmail || "",
        fullName: {
          givenName: extractedGivenName || "",
          familyName: extractedFamilyName || ""
        },
        isVerified: true
      });
      await appleUser.save();
      console.log('✅ AppleUser saved:', appleUser);
    } else {
      // ✅ Subsequent login - Update missing data only
      console.log('📝 Updating existing AppleUser');
      
      appleUser.identityToken = identityToken;
      appleUser.isVerified = true;
      
      // Update email if missing
      if (extractedEmail && (!appleUser.email || appleUser.email === "")) {
        appleUser.email = extractedEmail;
        console.log('✅ Updated AppleUser email:', extractedEmail);
      }
      
      // Update name if missing
      if (extractedGivenName && (!appleUser.fullName?.givenName || appleUser.fullName.givenName === "")) {
        appleUser.fullName = appleUser.fullName || {};
        appleUser.fullName.givenName = extractedGivenName;
      }
      if (extractedFamilyName && (!appleUser.fullName?.familyName || appleUser.fullName.familyName === "")) {
        appleUser.fullName = appleUser.fullName || {};
        appleUser.fullName.familyName = extractedFamilyName;
      }
      
      await appleUser.save();
      console.log('✅ AppleUser updated:', appleUser);
    }

    // ========================
    // STEP 3: Get Final Email
    // ========================
    const finalEmail = extractedEmail || appleUser.email;

    if (!finalEmail) {
      console.log('❌ No email available from anywhere');
      return res.status(400).json({ 
        noUser: true, 
        message: 'Email not available. Please contact support.',
        appleUserId: appleUserId
      });
    }

    console.log('📧 Final email:', finalEmail);

    // ========================
    // STEP 4: Check User Collection
    // ========================
    let user = await User.findOne({ email: finalEmail });

    // ========================
    // CASE 1: User doesn't exist → Signup flow
    // ========================
    if (!user) {
      console.log('🆕 User not found, returning data for signup');
      
      const fullNameString = `${appleUser.fullName?.givenName || ""} ${appleUser.fullName?.familyName || ""}`.trim();
      
      return res.status(200).json({ 
        noUser: true, 
        email: finalEmail, 
        fullName: {
          givenName: appleUser.fullName?.givenName || "",
          familyName: appleUser.fullName?.familyName || ""
        },
        name: fullNameString || "Apple User",
        appleUserId: appleUserId
      });
    }

    // ========================
    // CASE 2: User exists but not verified → Continue onboarding
    // ========================
    console.log('✅ User found:', user.email, '| Verified:', user.isVerified);
    
    if (!user.isVerified) {
      console.log('⚠️ User not verified, returning partial login');
      
      // Update name if needed
      const appleFullName = `${appleUser.fullName?.givenName || ""} ${appleUser.fullName?.familyName || ""}`.trim();
      if (appleFullName && (!user.name || user.name.trim() === "" || user.name.toLowerCase() === "new user")) {
        user.name = appleFullName;
      }
      
      user.isVerified = true; // ✅ Mark as verified since Apple verified
      await user.save();
      
      const token = generateToken(user._id, req.headers['x-device'] || 'web');
      
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: false, // ⚠️ Send false so frontend knows to complete profile
        token,
        message: 'Complete your profile'
      });
    }

    // ========================
    // CASE 3: User exists and verified → Full login
    // ========================
    // Update name if it's still "new user"
    const appleFullName = `${appleUser.fullName?.givenName || ""} ${appleUser.fullName?.familyName || ""}`.trim();
    if (appleFullName && (!user.name || user.name.trim() === "" || user.name.toLowerCase() === "new user")) {
      user.name = appleFullName;
      console.log('📝 Updated user name to:', appleFullName);
    }

    await user.save();

    const token = generateToken(user._id, req.headers['x-device'] || 'web');
    
    console.log('🎉 Login successful for:', user.email);
    
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: true,
      token,
      message: 'Login successful'
    });

  } catch (err) {
    console.error('❌ Apple login error:', err);
    return res.status(500).json({ 
      message: 'Server Error', 
      error: err.message 
    });
  }
};
exports.adminlogin = async (req, res) => {
  const { email, password } = req.body;
  console.log('LOGIN HIT', req.body);

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Check for admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // ✅ Check email verification if needed
    if (!user.isVerified) {
      return res.status(403).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id, req.headers['x-device'] || 'web'),
        isVerified: user.isVerified,
        message: 'Please complete the fitness profile and verify your email to proceed.',
      });
    }

    // ✅ Success response
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: generateToken(user._id, req.headers['x-device'] || 'web'),
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('LOGIN HIT', req.body);

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isVerified) {
        return res.status(403).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id,req.headers['x-device'] || 'web'),
          isVerified: user.isVerified,
          message: 'Please complete the fitness profile and verify your email to proceed.' })
    }
      

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
exports.changeadminPassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  console.log('Password Change Request:', email);

  try {
    const user = await User.findOne({ email });

    // Check if user exists and is admin
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin account not found' });
    }

    // Check if old password is correct
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    // Update password
    user.password = newPassword; // this should trigger pre-save hook to hash
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
exports.verifiedLogin = async (req, res) => {
  const { email } = req.body;
  console.log('verifiedLogin HIT', req.body);

  try {
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'No user registered with this email. Please sign up first.' });
    }
    if (!user.isVerified) {
        return res.status(403).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id,req.headers['x-device'] || 'web'),
          isVerified: user.isVerified,
          message: 'Please complete the fitness profile and verify your email to proceed.' })
    }
      

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
//verify otp for registration
exports.otp_verify = async (req, res) => {
    const { email, otp } = req.body;
    console.log('OTP VERIFY HIT', req.body);
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      if (!user.otp || user.otp != otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
  
      const now = new Date();
      if (!user.otpExpires || user.otpExpires < now) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }
  
      // OTP is valid
      user.isVerified = true;
      user.otp = null;
      user.otpExpires = null;
      await user.save();
  
      res.status(200).json({ 
        user:user,
        token: generateToken(user._id),
        message: 'OTP verified successfully' 
      });
  
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  };
  
// resend otp for registration
exports.resend_otp = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const now = new Date();
      if (user.otpExpires && user.otpExpires > now) {
        const secondsLeft = Math.floor((user.otpExpires - now) / 1000);
        return res.status(429).json({
          message: `Please wait ${secondsLeft} seconds before requesting another OTP.`,
        });
      }
  
      // Generate new OTP and set expiry (e.g., 5 minutes from now)
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
      user.otp = otp;
      user.otpExpires = expiryTime;
      await user.save();
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Resend OTP - LiftVerse Pro',
        html: `<h1>Resend OTP</h1>
               <p>Your new OTP is:</p>
               <h2>${otp}</h2>
               <p>This OTP is valid for 5 minutes.</p>`,
      };
  
      await sendMail(mailOptions);
      res.json({ message: 'OTP resent successfully' });
  
    } catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  };
// Forget password  
exports.forget_password = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const now = new Date();
      if (user.passresetOtpExpires && user.passresetOtpExpires > now) 
        {
        const secondsLeft = Math.floor((user.passresetOtpExpires - now) / 1000);
        // return res.status(429).json({
        //   message: `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
        // });
      }
  
      // Generate OTP and expiry time (5 min)
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000);
  
      user.passresetOtp = otp;
      user.passresetOtpExpires = expiryTime;
      await user.save();
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - LiftVerse Pro',
        html: `<h1>Password Reset Request</h1>
               <p>Your OTP for password reset is:</p>
               <h2>${otp}</h2>
               <p>This OTP is valid for 5 minutes.</p>`,
      };
  
      await sendMail(mailOptions);
      res.json({ message: 'OTP sent successfully' });
    }
    catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  };
// Reset password  
exports.reset_password = async (req, res) => {
    const { email, otp, newPassword } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      if (user.passresetOtp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
  
      const now = new Date();
      if (!user.passresetOtpExpires || user.passresetOtpExpires < now) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }
  
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
      }
  
      // Reset password and clear OTP
      user.password = newPassword;
      user.passresetOtp = null;
      user.passresetOtpExpires = null;
      await user.save();
  
      res.json({ message: 'Password reset successfully' });
    }
    catch (err) {
      res.status(500).json({ message: 'Server Error', error: err.message });
    }
  };
// Change password  
exports.change_password = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (newPassword) user.password = newPassword;

    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
// Get user profile
exports.profile = async (req, res) => {
  const userId = req.user._id;
  console.log('fetching user profile', req.user._id);

  try {
    const user = await User.findById(userId).select('-password');
      console.log('User profile fetched:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      role: user.role, // e.g., 'user', 'admin'
      _id: user._id,
      phone: user.phone,
      profilePicture: user.profilePicture,
      age: user.age,
      height: user.height,
      gender: user.gender,
      address: user.address,
      exercisePreferences:user.exercisePreferences,
      favorites:user.favorites,
      primaryFitnessGoal:user.primaryFitnessGoal,
      weight:user.weight,
      weightLabel:user.weightLabel,
      heightLabel:user.heightLabel,
      fitnessExperience:user.fitnessExperience,
restDays:user.restDays,
      physicalLimitation:user.physicalLimitation,
      workoutDaysPerWeek:user.workoutDaysPerWeek,
      calorieGoalPerDay:user.calorieGoalPerDay
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Update user profile
exports.update_user = async (req, res) => {
  const userId = req.user._id;
  const { name, phone, profilePicture, age, height, gender, address, weight, workoutDaysPerWeek, restDays, exercisePreferences, physicalLimitation, primaryFitnessGoal } = req.body;
  console.log('Update user request:', req.body);
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (req.file) user.profilePicture = `/profileimg/${req.file.filename}`;
    if (age !== undefined) user.age = age;
    if (height !== undefined) user.height = height;
    if (gender) user.gender = gender;
    if (address) user.address = address;
    if (weight !== undefined) user.weight = weight;
    if (workoutDaysPerWeek !== undefined) user.workoutDaysPerWeek = workoutDaysPerWeek;

    if (restDays) user.restDays = JSON.parse(restDays);
if (exercisePreferences) user.exercisePreferences = JSON.parse(exercisePreferences);
if (physicalLimitation) user.physicalLimitation = physicalLimitation;
    if (primaryFitnessGoal) user.primaryFitnessGoal = primaryFitnessGoal;

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


// Delete user account
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID missing in request' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne(); // better than `.remove()` which is deprecated
    res.json({ message: 'User deleted successfully' });

  } catch (err) {
    console.error('Delete error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Update user by ID (Admin only)
exports.updateUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;
    const { name, email, role, isVerified } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields only if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    // Return user data without sensitive information
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      // Add other fields you want to return
    };

    res.json({ 
      message: 'User updated successfully', 
      user: updatedUser 
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find({}).select('-password -otp -otpExpires -passresetOtp -passresetOtpExpires');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Search users by name or email (for sharing plans)
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    console.log('🔍 Search users called with query:', q);
    console.log('🔍 Current user ID:', currentUserId);

    if (!q || q.trim().length === 0) {
      console.log('🔍 Empty query, returning empty array');
      return res.json({ success: true, users: [] });
    }

    const searchQuery = q.trim();
    console.log('🔍 Searching for:', searchQuery);
    
    // Search by name or email (case insensitive, partial match)
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('_id name email')
    .limit(20); // Limit results to 20 users

    console.log('🔍 Found users:', users.length);

    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      displayName: user.name || user.email
    }));

    console.log('🔍 Formatted users:', formattedUsers);

    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (err) {
    console.error('❌ Search users error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: err.message 
    });
  }
};

// Delete specific user (Admin only)
exports.deleteUserById = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });

  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.completedWorkout = async (req, res) => {
  try {
    const { userId, targetedMuscle, duration } = req.body;

    let user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Add 1 workout day  
    user.totalWorkoutDays = (user.totalWorkoutDays || 0) + 1;

    // Add duration
    user.totalWorkoutDuration = (user.totalWorkoutDuration || 0) + duration;

    // Track muscles hit  
    if (!user.musclesTargeted) user.musclesTargeted = {};

    user.musclesTargeted[targetedMuscle] =
      (user.musclesTargeted[targetedMuscle] || 0) + 1;

    await user.save();

    res.json({
      message: "Workout saved successfully",
      totalDays: user.totalWorkoutDays,
      totalDuration: user.totalWorkoutDuration,
      musclesTargeted: user.musclesTargeted
    });

  } catch (error) {
    console.log("Save workout error:", error);
    res.status(500).json({ message: "Server error" });
  }
}