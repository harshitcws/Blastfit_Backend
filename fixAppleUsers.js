// ============================================
// ONE-TIME FIX SCRIPT - Fix Existing AppleUsers
// ============================================
// Run this once to fix all AppleUsers with null emails

// const AppleUser = require('./models/AppleUser');
const AppleUser = require('./models/AppleUser');

const mongoose = require('mongoose');
require('dotenv').config();

async function fixAppleUsersEmails() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Find all AppleUsers with null or empty email
    const appleUsers = await AppleUser.find({
      $or: [
        { email: null },
        { email: "" },
        { email: { $exists: false } }
      ]
    });

    console.log(`🔍 Found ${appleUsers.length} AppleUsers with missing emails`);

    let fixed = 0;
    let failed = 0;

    for (const appleUser of appleUsers) {
      try {
        if (!appleUser.identityToken) {
          console.log(`⚠️ No token for ${appleUser.appleUserId}, skipping...`);
          continue;
        }

        // Extract email from JWT token
        const tokenParts = appleUser.identityToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], 'base64').toString()
          );

          if (payload.email) {
            appleUser.email = payload.email;
            
            // Also extract name if available
            if (payload.given_name && !appleUser.fullName?.givenName) {
              appleUser.fullName = appleUser.fullName || {};
              appleUser.fullName.givenName = payload.given_name;
            }
            if (payload.family_name && !appleUser.fullName?.familyName) {
              appleUser.fullName = appleUser.fullName || {};
              appleUser.fullName.familyName = payload.family_name;
            }

            await appleUser.save();
            console.log(`✅ Fixed: ${appleUser.appleUserId} → ${payload.email}`);
            fixed++;
          } else {
            console.log(`⚠️ No email in token for ${appleUser.appleUserId}`);
            failed++;
          }
        }
      } catch (error) {
        console.error(`❌ Error fixing ${appleUser.appleUserId}:`, error.message);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${appleUsers.length}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
fixAppleUsersEmails();