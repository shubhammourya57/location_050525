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

const sharp = require('sharp');
const path = require('path');
const { uploadBufferToS3 } = require('../middleware/uploadToS3');

exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(file.originalname).toLowerCase();
    let filename = file.originalname.replace(ext, '.png');
    let buffer = file.buffer;
    let contentType = 'image/png';

    if (ext === '.tif' || ext === '.tiff') {
      buffer = await sharp(file.buffer).png().toBuffer();
    } else {
      filename = file.originalname;
      contentType = file.mimetype;
    }

    const s3Url = await uploadBufferToS3(buffer, filename, contentType);
    res.status(200).json({ url: s3Url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
};
