import express from 'express';
import { User } from '../models/index.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// Updated backend/src/routes/users.js - Add dashboard endpoint
// Insert this after the existing routes in src/routes/users.js

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    // Fetch user's progress records
    const progressRecords = await Progress.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: LearningPath,
          as: 'learningPath',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        },
        {
          model: Resource,
          as: 'resource'
        }
      ]
    });
    const learningPathsMap = {};
    progressRecords.forEach(progress => {
      const lpId = progress.learningPathId;
      if (!learningPathsMap[lpId]) {
        learningPathsMap[lpId] = {
          learningPath: progress.learningPath,
          totalResources: 0,
          completedResources: 0,
          inProgressResources: 0,
          totalTimeSpent: 0,
          overallCompletionPercentage: 0
        };
      }
      learningPathsMap[lpId].totalResources++;
      if (progress.status === 'completed') learningPathsMap[lpId].completedResources++;
      if (progress.status === 'in_progress') learningPathsMap[lpId].inProgressResources++;
      learningPathsMap[lpId].totalTimeSpent += progress.timeSpentMinutes || 0;
      learningPathsMap[lpId].overallCompletionPercentage = (learningPathsMap[lpId].completedResources / learningPathsMap[lpId].totalResources) * 100;
    });

    const progress = Object.values(learningPathsMap);

    const totalPaths = progress.length;
    const completedPaths = progress.filter(p => p.overallCompletionPercentage === 100).length;
    const inProgressPaths = progress.filter(p => p.overallCompletionPercentage > 0 && p.overallCompletionPercentage < 100).length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.totalTimeSpent, 0);

    res.json({
      success: true,
      dashboard: {
        totalPaths,
        completedPaths,
        inProgressPaths,
        totalTimeSpent,
        progress
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Updated backend/src/routes/users.js - Add endpoint for updating user roles (for admin)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (role) user.role = role;
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
