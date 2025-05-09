// File: controllers/locationController.js
const { uploadToS3, fetchFromS3,uploadBufferToS3,downloadCSV,uploadCSV,modifyCSV} = require('../middleware/uploadToS3');
// const {  completeMultipartUpload,uploadPartToS3,startMultipartUpload,downloadFromS3 } = require('../middleware/test.js');
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET; // Store in env in production
const sharp = require('sharp');
const path = require('path'); 
const fs = require("fs");
const csv = require("csv-parser");


exports.createLocation = async (req, res) => {
  const { locationID } = req.params;
  const { type } = req.query; // read type from query
  const locationData = req.body;
  const file = req.file;

  try {
    let imageUrl = null;

    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      let filename = file.originalname.replace(ext, '.png');
      let buffer = file.buffer;
      let contentType = 'image/png';

      // 🧠 Convert TIFF to PNG if needed
      if (ext === '.tif' || ext === '.tiff') {
        buffer = await sharp(file.buffer).png().toBuffer();
      } else {
        filename = file.originalname;
        contentType = file.mimetype;
      }

      // 👇 Apply custom filename if type is 'floor1'
      if (type) {
        filename = `${type}.png`; // create filename from type value
      }

      // 📤 Upload image to S3
      imageUrl = await uploadBufferToS3(buffer, filename, contentType);

      // Add image URL to location data
      locationData.imageUrl = imageUrl;
    }

    // 📤 Upload JSON metadata
    const result = await uploadToS3(locationData, locationID);

    return res.status(200).json({
      success: true,
      message: "🎉 Location and image uploaded successfully!",
      imageUrl,
      data: locationData,
      s3Result: result,
    });
  } catch (error) {
    console.error("📦 Upload Failed:", error);
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
  const locationData = req.body;
  const file = req.file;

  try {
    let imageUrl = null;

    if (file) {
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

      imageUrl = await uploadBufferToS3(buffer, filename, contentType);
      locationData.imageUrl = imageUrl;
    }

    const result = await updateOnS3(locationData, locationID);

    return res.status(200).json({
      success: true,
      message: "✏️ Location updated successfully!",
      imageUrl,
      data: locationData,
      s3Result: result,
    });
  } catch (error) {
    console.error("📦 Update Failed:", error);
    return res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

exports.processCSV = async (req, res) => {
  try {
    const downloadedPath = await downloadCSV();
    const updatedPath = await modifyCSV(downloadedPath);
    const uploadedKey = await uploadCSV(updatedPath);
    res.json({ message: 'CSV processed and uploaded', key: uploadedKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing CSV' });
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
;




