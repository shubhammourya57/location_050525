const express = require('express');
const router = express.Router();
const { createLocation,getLocation,updateLocation,deleteLocation,loginUser,uploadImage } = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have an auth middleware
const upload = require('../middleware/uploadMiddleware');
router.post('/loginUser',loginUser)
router.post('/location/:locationID',authMiddleware,createLocation);
router.get('/location/:locationID',authMiddleware, getLocation);
router.put('/location/:locationID',authMiddleware, updateLocation);
router.delete('/location/:locationID',authMiddleware,deleteLocation);
router.post('/upload-image', upload.single('file'), uploadImage);

module.exports = router;
