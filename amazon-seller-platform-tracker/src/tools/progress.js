const fs = require('fs-extra');
const path = require('path');

/**
 * Track implementation progress for the Amazon Seller Platform
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const trackImplementationProgress = (req, res) => {
  try {
    const { action, taskId, status, description, component, percentComplete } = req.body;
    
    // Load the current progress data
    const progressFilePath = path.join(__dirname, '../../data/progress.json');
    const progressData = fs.readJsonSync(progressFilePath);
    
    // Handle different actions
    switch(action) {
      case 'add':
        // Add a new task
        const newTask = {
          id: taskId || `task-${Date.now()}`,
          description: description || 'New task',
          component: component || 'general',
          status: status || 'pending',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          percentComplete: percentComplete || 0
        };
        
        progressData.tasks.push(newTask);
        break;
        
      case 'update':
        // Update an existing task
        const taskIndex = progressData.tasks.findIndex(task => task.id === taskId);
        if (taskIndex >= 0) {
          progressData.tasks[taskIndex] = {
            ...progressData.tasks[taskIndex],
            status: status || progressData.tasks[taskIndex].status,
            description: description || progressData.tasks[taskIndex].description,
            component: component || progressData.tasks[taskIndex].component,
            percentComplete: percentComplete !== undefined ? percentComplete : progressData.tasks[taskIndex].percentComplete,
            updated: new Date().toISOString()
          };
        } else {
          return res.status(404).json({ error: 'Task not found' });
        }
        break;
        
      case 'delete':
        // Remove a task
        const filteredTasks = progressData.tasks.filter(task => task.id !== taskId);
        if (filteredTasks.length === progressData.tasks.length) {
          return res.status(404).json({ error: 'Task not found' });
        }
        progressData.tasks = filteredTasks;
        break;
        
      case 'list':
        // Just return the current data
        return res.status(200).json(progressData);
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Calculate overall completion percentage
    const completionSum = progressData.tasks.reduce((sum, task) => sum + task.percentComplete, 0);
    progressData.completion = progressData.tasks.length > 0 
      ? Math.round(completionSum / progressData.tasks.length) 
      : 0;
    
    // Update last updated timestamp
    progressData.lastUpdated = new Date().toISOString();
    
    // Save the updated data
    fs.writeJsonSync(progressFilePath, progressData, { spaces: 2 });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      data: progressData
    });
    
  } catch (error) {
    console.error('Error in trackImplementationProgress:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = trackImplementationProgress;
