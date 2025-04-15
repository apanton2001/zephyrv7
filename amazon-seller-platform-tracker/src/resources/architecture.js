const fs = require('fs-extra');
const path = require('path');

const componentArchitecture = (req, res) => {
  try {
    const architectureFilePath = path.join(__dirname, '../../data/architecture.json');
    if (!fs.existsSync(architectureFilePath)) {
      return res.status(404).json({ error: 'Component architecture not found' });
    }
    const architectureData = fs.readJsonSync(architectureFilePath);
    res.status(200).json({
      status: 'success',
      data: architectureData
    });
  } catch (error) {
    console.error('Error in componentArchitecture resource:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = componentArchitecture;
