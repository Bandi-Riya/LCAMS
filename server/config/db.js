const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.DB_URI) {
      throw new Error("DB_URI is missing in environment variables.");
    }

    // eslint-disable-next-line no-console
    console.log("Using DB_URI:", process.env.DB_URI);
    const conn = await mongoose.connect(process.env.DB_URI);

    // eslint-disable-next-line no-console
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
