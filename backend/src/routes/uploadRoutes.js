const express = require('express');
const router = express.Router();
const { upload, uploadProfileImage } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/', authenticate, upload.single('image'), uploadProfileImage);

// Error handler specifically for multer errors
router.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

module.exports = router;
