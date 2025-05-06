const uploadToS3 = require('../uploadToS3');

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
