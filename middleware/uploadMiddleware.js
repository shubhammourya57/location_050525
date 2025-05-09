const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50000 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    console.log(`Mimetype: ${file.mimetype}, Extension: ${file.originalname.split('.').pop()}`);
    
    const ext = file.originalname.split('.').pop().toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    // Allow image files (e.g., .png, .jpg, .jpeg, .tif, .tiff)
    if (mimeType.includes('image') || ext === 'tif' || ext === 'tiff') {
      cb(null, true);
    }
    // Allow .mp4 and .mkv files (with correct mime type)
    else if ((ext === 'mp4' && mimeType === 'video/mp4') || (ext === 'mkv' && mimeType === 'video/x-matroska')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and .mp4, .mkv videos are allowed!'), false);
    }
  },
});

module.exports = upload;
