const { S3Client, PutObjectCommand,GetObjectCommand  } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const fs = require("fs"); 
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const { parse } = require('@fast-csv/parse');
const { writeToStream } = require('@fast-csv/format');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const streamToBuffer = async (stream) => {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

const streamToString = async (stream) => {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
  });
};
const downloadCSV = async () => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: process.env.CSV_FILE_KEY,
  };

  const localPath = path.join(__dirname, '../public/uploads/location/location.csv'); // ✅ full file path
   // ✅ writing to a file
  

  const command = new GetObjectCommand(params);
  const data = await s3.send(command);


  const buffer = await streamToBuffer(data.Body);
  fs.writeFileSync(localPath, buffer);
  
  return localPath;
};

const uploadCSV = async (filePath, uploadKey = 'images/floors_updated.csv') => {
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uploadKey,
    Body: fileContent,
    ContentType: 'text/csv',
  });

  await s3.send(command);
  return uploadKey;
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
  const key = `uploads/${filename}`;

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


// const modifyCSV = async (inputPath) => {
//   const outputPath = path.join(__dirname, '../public/floors_updated.csv');

//   return new Promise((resolve, reject) => {
//     const updatedRows = [];
//     fs.createReadStream(inputPath)
//       .pipe(csv({ headers: true, mapHeaders: ({ header }) => header.trim() }))
//       .on('data', (row) => {
//         const originalPath = row.s3_file_path;
//         if (!originalPath) return;

//         const extIndex = originalPath.lastIndexOf('/');
//         const fileName = originalPath.substring(extIndex + 1).replace('.tiff', '');
//         const newFileName = `${row.floor}_${fileName}.png`;

//         row.s3_file_path = `images/${newFileName}`;
//         row.image_format = 'PNG';
//         updatedRows.push(row);
//       })
//       .on('end', () => {
//         const ws = fs.createWriteStream(outputPath);
//         writeToStream(ws, updatedRows, { headers: true })
//           .on('finish', () => {
//             resolve(outputPath);
//           })
//           .on('error', reject);
//       })
//       .on('error', reject);
//   });
// };

const toSnakeCase = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // remove special chars
    .trim()
    .replace(/\s+/g, '_');    // spaces to underscores
};

const modifyCSV = async (inputPath) => {
  const outputPath = path.join(__dirname, '../public/floors_updated.csv');

  return new Promise((resolve, reject) => {
    const updatedRows = [];

    fs.createReadStream(inputPath)
      .pipe(parse({
        headers: headers => headers.map(h => h.trim()) // Trim header names
      }))
      .on('data', (row) => {
        const floor = row['floor'];
        const locationId = row['location Id'];

        if (locationId && floor) {
          const floorFormatted = toSnakeCase(floor);
          row['updated_image_path'] = `${locationId}/images/${floorFormatted}.png`;
        }

        updatedRows.push(row);
      })
      .on('end', () => {
        const ws = fs.createWriteStream(outputPath);
        writeToStream(ws, updatedRows, { headers: true })
          .on('finish', () => resolve(outputPath))
          .on('error', reject);
      })
      .on('error', reject);
  });
};




// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// const uploadBufferToS3 = async (buffer, filename, contentType) => {
//   const key = `uploads/${uuidv4()}-${filename}`;

//   const params = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     Body: buffer,
//     ContentType: contentType,
//   };

//   try {
//     const command = new PutObjectCommand(params);
//     await s3.send(command);

//     // ⏳ Generate signed GET URL valid for 5 minutes (300 seconds)
//     const getCommand = new GetObjectCommand({
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//     });

//     const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 300 }); // 5 minutes

//     return signedUrl;
//   } catch (err) {
//     console.error("❌ Error uploading buffer to S3:", err);
//     throw err;
//   }
// };

module.exports = {
  uploadToS3,
  fetchFromS3,
  uploadBufferToS3,
  downloadCSV,
  uploadCSV,
  modifyCSV,
  streamToBuffer,
};
