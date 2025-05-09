const { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const sharp = require('sharp'); // Assuming you have sharp installed for image conversion
const fs = require('fs');

// Initialize the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload the file in multiple parts to S3
exports.uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(file.originalname).toLowerCase();
    let filename = file.originalname.replace(ext, '.png');
    let buffer = file.buffer;
    let contentType = 'image/png';

    // Convert .tif or .tiff files to .png
    if (ext === '.tif' || ext === '.tiff') {
      buffer = await sharp(file.buffer).png().toBuffer();
    } else {
      filename = file.originalname;
      contentType = file.mimetype;
    }

    // Start multipart upload
    const uploadId = await startMultipartUpload(filename, contentType);
    
    // Split the file into chunks
    const partSize = 5 * 1024 * 1024; // 5MB per part
    const parts = Math.ceil(buffer.length / partSize);
    const partETags = [];
    
    // Upload each part
    for (let partNumber = 1; partNumber <= parts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(partNumber * partSize, buffer.length);
      const partBuffer = buffer.slice(start, end);

      // Upload the part
      const eTag = await uploadPartToS3(partBuffer, filename, uploadId, partNumber);
      partETags.push({ PartNumber: partNumber, ETag: eTag });
    }

    // Complete the multipart upload
    const s3Url = await completeMultipartUpload(uploadId, filename, partETags);

    res.status(200).json({ url: s3Url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
};

// Start a multipart upload
const startMultipartUpload = async (filename, contentType) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${filename}`,
    ContentType: contentType,
  };

  const command = new CreateMultipartUploadCommand(params);
  const data = await s3.send(command);
  return data.UploadId; // Return the UploadId for use in uploading parts
};

// Upload a part of the file
const uploadPartToS3 = async (buffer, filename, uploadId, partNumber) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${filename}`,
    PartNumber: partNumber,
    UploadId: uploadId,
    Body: buffer,
  };

  const command = new UploadPartCommand(params);
  const data = await s3.send(command);
  return data.ETag; // Return the ETag for the uploaded part
};

// Complete the multipart upload
const completeMultipartUpload = async (uploadId, filename, partETags) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${filename}`,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: partETags,
    },
  };

  const command = new CompleteMultipartUploadCommand(params);
  const data = await s3.send(command);
  
  // Construct and return the public URL
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
};
module.exports = { 
    startMultipartUpload,
    uploadPartToS3,
    completeMultipartUpload,
 };