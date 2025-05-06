const express = require('express');
const router = express.Router();
const { createLocation,getLocation,updateLocation,deleteLocation,loginUser } = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

router.post('/loginUser',loginUser)
router.post('/location/:locationID',authMiddleware,createLocation);
router.get('/location/:locationID',authMiddleware, getLocation);
router.put('/location/:locationID',authMiddleware, updateLocation);
router.delete('/location/:locationID',authMiddleware,deleteLocation);

module.exports = router;
