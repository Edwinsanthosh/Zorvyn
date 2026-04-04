const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection failed");
    console.log(error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
