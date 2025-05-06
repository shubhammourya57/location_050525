const express = require('express');
const router = express.Router();
const { createLocation } = require('../controllers/locationController');

router.post('/locations/:locationID', createLocation);

module.exports = router;
