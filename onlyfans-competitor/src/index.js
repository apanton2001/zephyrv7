const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { registerUser, loginUser } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OnlyFans Competitor API is running' });
});

// User registration endpoint
app.post('/api/register', registerUser);

// User login endpoint
app.post('/api/login', loginUser);

const { authMiddleware, creatorMiddleware, updateCreatorProfile, getCreatorProfile, listCreatorProfiles } = require('./creator');

// Placeholder for creator profile creation endpoint
app.post('/api/creator/profile', authMiddleware, creatorMiddleware, updateCreatorProfile);

// Get creator profile by profileId (public)
app.get('/api/creator/profile/:profileId', getCreatorProfile);

// List all creator profiles (public)
app.get('/api/creator/profiles', listCreatorProfiles);

app.listen(PORT, () => {
  console.log(`OnlyFans Competitor backend running on port ${PORT}`);
});
