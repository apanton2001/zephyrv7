const fs = require('fs-extra');
const path = require('path');
const jwt = require('jsonwebtoken');

const profilesFilePath = path.join(__dirname, '../data/creator-profiles.json');
const usersFilePath = path.join(__dirname, '../data/users.json');

// Helper to ensure data directories exist
const ensureDataDirectories = () => {
  const dataDir = path.join(__dirname, '../data');
  const contentDir = path.join(__dirname, '../data/content');
  
  fs.ensureDirSync(dataDir);
  fs.ensureDirSync(contentDir);
  
  if (!fs.existsSync(profilesFilePath)) {
    fs.writeJsonSync(profilesFilePath, { profiles: [] }, { spaces: 2 });
  }
};

// Helper to load creator profiles
const loadProfiles = () => {
  ensureDataDirectories();
  return fs.readJsonSync(profilesFilePath);
};

// Helper to save creator profiles
const saveProfiles = (data) => {
  fs.writeJsonSync(profilesFilePath, data, { spaces: 2 });
};

// Helper to load users
const loadUsers = () => {
  return fs.readJsonSync(usersFilePath);
};

// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Creator-only middleware
const creatorMiddleware = (req, res, next) => {
  if (!req.user.isCreator) {
    return res.status(403).json({ error: 'Creator access required' });
  }
  next();
};

// Create or update creator profile
const updateCreatorProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const { displayName, bio, subscriptionPrice, categories } = req.body;
    
    // Validate input
    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    
    if (subscriptionPrice < 0) {
      return res.status(400).json({ error: 'Subscription price cannot be negative' });
    }

    const data = loadProfiles();
    const existingProfile = data.profiles.find(p => p.userId === userId);
    
    if (existingProfile) {
      // Update existing profile
      const profileIndex = data.profiles.findIndex(p => p.userId === userId);
      data.profiles[profileIndex] = {
        ...existingProfile,
        displayName: displayName || existingProfile.displayName,
        bio: bio !== undefined ? bio : existingProfile.bio,
        subscriptionPrice: subscriptionPrice !== undefined ? subscriptionPrice : existingProfile.subscriptionPrice,
        categories: categories || existingProfile.categories,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new profile
      const newProfile = {
        profileId: `profile-${Date.now()}`,
        userId,
        displayName,
        bio: bio || '',
        subscriptionPrice: subscriptionPrice || 4.99,
        categories: categories || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscribers: 0,
        content: []
      };
      
      data.profiles.push(newProfile);
    }
    
    saveProfiles(data);
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      profile: data.profiles.find(p => p.userId === userId)
    });
  } catch (error) {
    console.error('Error in updateCreatorProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get creator profile
const getCreatorProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    
    const data = loadProfiles();
    const profile = data.profiles.find(p => p.profileId === profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Get creator's username from users data
    const usersData = loadUsers();
    const user = usersData.users.find(u => u.id === profile.userId);
    
    // Return profile without sensitive information
    const publicProfile = {
      ...profile,
      email: user ? user.email : null,
      userId: undefined, // Remove userId from public profile
      content: profile.content.map(c => ({
        ...c,
        filePath: undefined // Remove file paths from content items
      }))
    };
    
    res.status(200).json(publicProfile);
  } catch (error) {
    console.error('Error in getCreatorProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// List all creator profiles (public)
const listCreatorProfiles = async (req, res) => {
  try {
    const data = loadProfiles();
    
    // Return simplified profiles for listing
    const publicProfiles = data.profiles.map(profile => ({
      profileId: profile.profileId,
      displayName: profile.displayName,
      bio: profile.bio,
      subscriptionPrice: profile.subscriptionPrice,
      categories: profile.categories,
      subscribers: profile.subscribers,
      contentCount: profile.content.length
    }));
    
    res.status(200).json(publicProfiles);
  } catch (error) {
    console.error('Error in listCreatorProfiles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authMiddleware,
  creatorMiddleware,
  updateCreatorProfile,
  getCreatorProfile,
  listCreatorProfiles
};
