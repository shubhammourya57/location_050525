const express = require('express');
const router = express.Router();
const { createLocation,getLocation,updateLocation,loginUser,processCSV } = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const upload = require('../middleware/uploadMiddleware');
router.post('/loginUser',loginUser)
router.put('/location/:locationID',authMiddleware, upload.single('file'),createLocation);
router.get('/location/:locationID',authMiddleware, getLocation);
router.post("/upload-csv", upload.single("file"), processCSV);

module.exports = router;
