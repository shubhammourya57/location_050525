// File: controllers/locationController.js
const { uploadToS3, fetchFromS3 } = require('../middleware/uploadToS3');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // Store in env in production

exports.createLocation = async (req, res) => {
  const { locationID } = req.params;
  const locationData = req.body;

  try {
    const result = await uploadToS3(locationData, locationID);

    return res.status(200).json({
      success: true,
      message: "🎉 Location uploaded successfully to S3!",
      data: result,
    });
  } catch (error) {
    console.error("📦 S3 Upload Failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getLocation = async (req, res) => {
  const { locationID } = req.params;

  try {
    const result = await fetchFromS3(locationID);

    return res.status(200).json({
      success: true,
      message: "📦 Location fetched successfully from S3!",
      data: result,
    });
  } catch (error) {
    console.error("⚠️ S3 Fetch Failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.updateLocation = async (req, res) => {
  const { locationID } = req.params;
  const updatedData = req.body;

  try {
    // Overwrite existing data in S3 with new data
    const result = await uploadToS3(updatedData, locationID);

    return res.status(200).json({
      success: true,
      message: "✅ Location updated successfully in S3!",
      data: result,
    });
  } catch (error) {
    console.error("📦 S3 Update Failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deleteLocation = async (req, res) => {
  const { locationID } = req.params;

  try {
    const result = await deleteFromS3(locationID); // helper to delete from S3

    return res.status(200).json({
      success: true,
      message: "🗑️ Location deleted successfully from S3!",
      data: result,
    });
  } catch (error) {
    console.error("🧨 S3 Delete Failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.loginUser = async (req, res) => {

  const { email, password } = req.body;

  // Dummy validation — replace with DB check
  if (email === "admin@example.com" && password === "123456") {
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
};