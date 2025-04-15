const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');

// Helper to load users
const loadUsers = () => {
  if (!fs.existsSync(usersFilePath)) {
    fs.writeJsonSync(usersFilePath, { users: [] }, { spaces: 2 });
  }
  return fs.readJsonSync(usersFilePath);
};

// Helper to save users
const saveUsers = (data) => {
  fs.writeJsonSync(usersFilePath, data, { spaces: 2 });
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password, isCreator } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = loadUsers();
    const existingUser = data.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password: hashedPassword,
      isCreator: !!isCreator,
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    saveUsers(data);

    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user and return JWT token
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const data = loadUsers();
    const user = data.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, isCreator: user.isCreator }, 'your_jwt_secret', { expiresIn: '7d' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error in loginUser:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerUser,
  loginUser
};
