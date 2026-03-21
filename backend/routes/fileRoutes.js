const express = require('express');
const router = express.Router();
const File = require('../models/File');

// Serve file from database
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set({
      'Content-Type': file.contentType,
      'Content-Length': file.size,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
      'Cache-Control': 'public, max-age=86400'
    });

    res.send(file.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve file', error: error.message });
  }
});

// Download file (forces download instead of inline display)
router.get('/:id/download', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set({
      'Content-Type': file.contentType,
      'Content-Length': file.size,
      'Content-Disposition': `attachment; filename="${file.originalName}"`
    });

    res.send(file.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download file', error: error.message });
  }
});

module.exports = router;
