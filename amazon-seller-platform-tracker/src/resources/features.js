const fs = require('fs-extra');
const path = require('path');

const featureDatabase = (req, res) => {
  try {
    const featuresFilePath = path.join(__dirname, '../../data/features.json');
    if (!fs.existsSync(featuresFilePath)) {
      return res.status(404).json({ error: 'Feature database not found' });
    }
    const featuresData = fs.readJsonSync(featuresFilePath);
    res.status(200).json({
      status: 'success',
      data: featuresData
    });
  } catch (error) {
    console.error('Error in featureDatabase resource:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = featureDatabase;
