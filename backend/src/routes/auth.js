import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this username or email already exists' 
      });
    }

    // Validate role
    const validRoles = ['learner', 'instructor', 'admin'];
    const userRole = role && validRoles.includes(role) ? role : 'learner';

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: userRole
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email is provided
    if (!username && !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide username or email' 
      });
    }

    // Find user by username or email
    const user = await User.findOne({ 
      where: { 
        [User.sequelize.Op.or]: [
          { username: username || '' },
          { email: email || '' }
        ]
      } 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Validate password
    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message
    });
  }
});

export default router;
