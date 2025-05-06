const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (jsonData, locationID) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `public/uploads/location/${locationID}.json`,
    Body: JSON.stringify(jsonData, null, 2),
    ContentType: 'application/json',
  };

  try {
    const command = new PutObjectCommand(params);
    const result = await s3.send(command);
    return result;
  } catch (err) {
    console.error("❌ Error uploading to S3:", err);
    throw err;
  }
};

module.exports = uploadToS3;
