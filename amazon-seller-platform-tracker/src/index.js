const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs-extra');
const path = require('path');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Ensure data directories exist
const dataDir = path.join(__dirname, '../data');
fs.ensureDirSync(dataDir);

// Initialize data files if they don't exist
const initializeDataFiles = () => {
  const dataFiles = [
    { name: 'plan.json', default: { sections: [], lastUpdated: new Date().toISOString() } },
    { name: 'features.json', default: { features: [], lastUpdated: new Date().toISOString() } },
    { name: 'progress.json', default: { tasks: [], completion: 0, lastUpdated: new Date().toISOString() } },
    { name: 'architecture.json', default: { components: [], connections: [], lastUpdated: new Date().toISOString() } },
    { name: 'technical-debt.json', default: { items: [], priority: [], lastUpdated: new Date().toISOString() } }
  ];

  dataFiles.forEach(file => {
    const filePath = path.join(dataDir, file.name);
    if (!fs.existsSync(filePath)) {
      fs.writeJsonSync(filePath, file.default, { spaces: 2 });
      console.log(`Created ${file.name}`);
    }
  });
};

initializeDataFiles();

// Import tool handlers
const trackProgress = require('./tools/progress');
const featureMatrix = require('./tools/features');
const techDebtTracker = require('./tools/tech-debt');
const resourceMonitor = require('./tools/resources');

// Import resource handlers
const implementationPlan = require('./resources/plan');
const featureDatabase = require('./resources/features');
const componentArchitecture = require('./resources/architecture');
const progressDashboard = require('./resources/dashboard');

// MCP Protocol Endpoints for Tools
app.post('/mcp/tools/track_implementation_progress', trackProgress);
app.post('/mcp/tools/feature_matrix_manager', featureMatrix);
app.post('/mcp/tools/technical_debt_tracker', techDebtTracker);
app.post('/mcp/tools/resource_utilization_monitor', resourceMonitor);

// MCP Protocol Endpoints for Resources
app.get('/mcp/resources/implementation_plan', implementationPlan);
app.get('/mcp/resources/feature_database', featureDatabase);
app.get('/mcp/resources/component_architecture', componentArchitecture);
app.get('/mcp/resources/progress_dashboard', progressDashboard);

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Amazon Seller Platform Tracker MCP server running on port ${PORT}`);
  console.log(`Server is accessible via MCP protocol at localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
