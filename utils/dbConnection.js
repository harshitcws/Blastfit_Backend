const mongoose = require("mongoose");
// simple connection to MongoDB using mongoose
/*const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;*/

// Enhanced MongoDB connection with retry logic

const connectDB = async (retries = 5, delay = 3000) => {
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      break;
    } catch (error) {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      retries--;
      console.log(`🔁 Retrying in ${delay / 1000} seconds... (${retries} retries left)`);
      await new Promise(res => setTimeout(res, delay));
    }
  }

  if (!retries) {
    console.error("💥 Failed to connect to MongoDB after multiple attempts. Exiting.");
    process.exit(1);
  }
};

module.exports = connectDB;

