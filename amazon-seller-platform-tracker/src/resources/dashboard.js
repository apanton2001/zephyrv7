const fs = require('fs-extra');
const path = require('path');

const progressDashboard = (req, res) => {
  try {
    const progressFilePath = path.join(__dirname, '../../data/progress.json');
    if (!fs.existsSync(progressFilePath)) {
      return res.status(404).json({ error: 'Progress dashboard data not found' });
    }
    const progressData = fs.readJsonSync(progressFilePath);
    res.status(200).json({
      status: 'success',
      data: progressData
    });
  } catch (error) {
    console.error('Error in progressDashboard resource:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = progressDashboard;
