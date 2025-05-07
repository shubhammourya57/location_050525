const { S3Client, PutObjectCommand,GetObjectCommand  } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const streamToString = async (stream) => {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
};
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

const fetchFromS3 = async (locationID) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `public/uploads/location/${locationID}.json`,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await s3.send(command);

    // ✅ Convert the stream to a string
    const fileContent = await streamToString(response.Body);

    // ✅ Return parsed JSON
    return JSON.parse(fileContent);
  } catch (err) {
    console.error("❌ Error fetching from S3:", err);
    throw err;
  }
};
const uploadBufferToS3 = async (buffer, filename, contentType) => {
  const key = `uploads/${uuidv4()}-${filename}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);

    // Construct public URL manually (only works if bucket is public or has CloudFront/CDN set up)
    const Location = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return Location;
  } catch (err) {
    console.error("❌ Error uploading buffer to S3:", err);
    throw err;
  }
};

module.exports = {
  uploadToS3,
  fetchFromS3,
  uploadBufferToS3,
};
