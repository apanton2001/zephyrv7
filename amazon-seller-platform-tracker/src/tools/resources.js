const fs = require('fs-extra');
const path = require('path');

/**
 * Monitor resource utilization for the Amazon Seller Platform
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resourceUtilizationMonitor = (req, res) => {
  try {
    const { action, resourceId, name, type, usage, status, notes } = req.body;
    
    // Load the current resource data
    const resourceFilePath = path.join(__dirname, '../../data/resources.json');
    let resourceData = { resources: [], lastUpdated: new Date().toISOString() };
    if (fs.existsSync(resourceFilePath)) {
      resourceData = fs.readJsonSync(resourceFilePath);
    }
    
    // Handle different actions
    switch(action) {
      case 'add':
        // Add a new resource
        const newResource = {
          id: resourceId || `resource-${Date.now()}`,
          name: name || 'New Resource',
          type: type || 'general',
          usage: usage || 0,
          status: status || 'active',
          notes: notes || '',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        
        resourceData.resources.push(newResource);
        break;
        
      case 'update':
        // Update an existing resource
        const resourceIndex = resourceData.resources.findIndex(resource => resource.id === resourceId);
        if (resourceIndex >= 0) {
          resourceData.resources[resourceIndex] = {
            ...resourceData.resources[resourceIndex],
            name: name || resourceData.resources[resourceIndex].name,
            type: type || resourceData.resources[resourceIndex].type,
            usage: usage !== undefined ? usage : resourceData.resources[resourceIndex].usage,
            status: status || resourceData.resources[resourceIndex].status,
            notes: notes || resourceData.resources[resourceIndex].notes,
            updated: new Date().toISOString()
          };
        } else {
          return res.status(404).json({ error: 'Resource not found' });
        }
        break;
        
      case 'delete':
        // Remove a resource
        const filteredResources = resourceData.resources.filter(resource => resource.id !== resourceId);
        if (filteredResources.length === resourceData.resources.length) {
          return res.status(404).json({ error: 'Resource not found' });
        }
        resourceData.resources = filteredResources;
        break;
        
      case 'list':
        // Just return the current data
        return res.status(200).json(resourceData);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Update last updated timestamp
    resourceData.lastUpdated = new Date().toISOString();
    
    // Save the updated data
    fs.writeJsonSync(resourceFilePath, resourceData, { spaces: 2 });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      data: resourceData
    });
    
  } catch (error) {
    console.error('Error in resourceUtilizationMonitor:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = resourceUtilizationMonitor;
