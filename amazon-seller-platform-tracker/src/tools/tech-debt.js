const fs = require('fs-extra');
const path = require('path');

/**
 * Track technical debt items for the Amazon Seller Platform
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const technicalDebtTracker = (req, res) => {
  try {
    const { action, debtId, description, priority, status, component, notes } = req.body;
    
    // Load the current technical debt data
    const debtFilePath = path.join(__dirname, '../../data/technical-debt.json');
    const debtData = fs.readJsonSync(debtFilePath);
    
    // Handle different actions
    switch(action) {
      case 'add':
        // Add a new debt item
        const newDebt = {
          id: debtId || `debt-${Date.now()}`,
          description: description || 'New technical debt item',
          priority: priority || 'medium',
          status: status || 'open',
          component: component || 'general',
          notes: notes || '',
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        };
        
        debtData.items.push(newDebt);
        break;
        
      case 'update':
        // Update an existing debt item
        const debtIndex = debtData.items.findIndex(item => item.id === debtId);
        if (debtIndex >= 0) {
          debtData.items[debtIndex] = {
            ...debtData.items[debtIndex],
            description: description || debtData.items[debtIndex].description,
            priority: priority || debtData.items[debtIndex].priority,
            status: status || debtData.items[debtIndex].status,
            component: component || debtData.items[debtIndex].component,
            notes: notes || debtData.items[debtIndex].notes,
            updated: new Date().toISOString()
          };
        } else {
          return res.status(404).json({ error: 'Technical debt item not found' });
        }
        break;
        
      case 'delete':
        // Remove a debt item
        const filteredDebt = debtData.items.filter(item => item.id !== debtId);
        if (filteredDebt.length === debtData.items.length) {
          return res.status(404).json({ error: 'Technical debt item not found' });
        }
        debtData.items = filteredDebt;
        break;
        
      case 'list':
        // Just return the current data
        return res.status(200).json(debtData);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Update last updated timestamp
    debtData.lastUpdated = new Date().toISOString();
    
    // Save the updated data
    fs.writeJsonSync(debtFilePath, debtData, { spaces: 2 });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      data: debtData
    });
    
  } catch (error) {
    console.error('Error in technicalDebtTracker:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = technicalDebtTracker;
