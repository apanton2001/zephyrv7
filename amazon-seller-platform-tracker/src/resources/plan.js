const fs = require('fs-extra');
const path = require('path');

const implementationPlan = (req, res) => {
  try {
    const planFilePath = path.join(__dirname, '../../data/plan.json');
    if (!fs.existsSync(planFilePath)) {
      return res.status(404).json({ error: 'Implementation plan not found' });
    }
    const planData = fs.readJsonSync(planFilePath);
    res.status(200).json({
      status: 'success',
      data: planData
    });
  } catch (error) {
    console.error('Error in implementationPlan resource:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = implementationPlan;
