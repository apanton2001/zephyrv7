const fs = require('fs-extra');
const path = require('path');

/**
 * Manage feature matrix for the Amazon Seller Platform
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const featureMatrixManager = (req, res) => {
  try {
    const { action, featureId, name, sourceProduct, description, status, priority, complexity, implementationDetails } = req.body;
    
    // Load the current features data
    const featuresFilePath = path.join(__dirname, '../../data/features.json');
    const featuresData = fs.readJsonSync(featuresFilePath);
    
    // Handle different actions
    switch(action) {
      case 'add':
        // Add a new feature
        const newFeature = {
          id: featureId || `feature-${Date.now()}`,
          name: name || 'New Feature',
          sourceProduct: sourceProduct || 'unknown',
          description: description || '',
          status: status || 'not-started',
          priority: priority || 'medium',
          complexity: complexity || 'medium',
          implementationDetails: implementationDetails || '',
          added: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        
        featuresData.features.push(newFeature);
        break;
        
      case 'update':
        // Update an existing feature
        const featureIndex = featuresData.features.findIndex(feature => feature.id === featureId);
        if (featureIndex >= 0) {
          featuresData.features[featureIndex] = {
            ...featuresData.features[featureIndex],
            name: name || featuresData.features[featureIndex].name,
            sourceProduct: sourceProduct || featuresData.features[featureIndex].sourceProduct,
            description: description || featuresData.features[featureIndex].description,
            status: status || featuresData.features[featureIndex].status,
            priority: priority || featuresData.features[featureIndex].priority,
            complexity: complexity || featuresData.features[featureIndex].complexity,
            implementationDetails: implementationDetails || featuresData.features[featureIndex].implementationDetails,
            updated: new Date().toISOString()
          };
        } else {
          return res.status(404).json({ error: 'Feature not found' });
        }
        break;
        
      case 'delete':
        // Remove a feature
        const filteredFeatures = featuresData.features.filter(feature => feature.id !== featureId);
        if (filteredFeatures.length === featuresData.features.length) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        featuresData.features = filteredFeatures;
        break;
        
      case 'list':
        // Just return the current data
        return res.status(200).json(featuresData);
        
      case 'stats':
        // Calculate and return feature statistics
        const stats = {
          totalFeatures: featuresData.features.length,
          byStatus: {},
          bySourceProduct: {},
          byPriority: {},
          byComplexity: {}
        };
        
        // Count features by different categories
        featuresData.features.forEach(feature => {
          // Status counts
          stats.byStatus[feature.status] = (stats.byStatus[feature.status] || 0) + 1;
          
          // Source product counts
          stats.bySourceProduct[feature.sourceProduct] = (stats.bySourceProduct[feature.sourceProduct] || 0) + 1;
          
          // Priority counts
          stats.byPriority[feature.priority] = (stats.byPriority[feature.priority] || 0) + 1;
          
          // Complexity counts
          stats.byComplexity[feature.complexity] = (stats.byComplexity[feature.complexity] || 0) + 1;
        });
        
        return res.status(200).json({
          status: 'success',
          data: stats
        });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Update last updated timestamp
    featuresData.lastUpdated = new Date().toISOString();
    
    // Save the updated data
    fs.writeJsonSync(featuresFilePath, featuresData, { spaces: 2 });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      data: featuresData
    });
    
  } catch (error) {
    console.error('Error in featureMatrixManager:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = featureMatrixManager;
