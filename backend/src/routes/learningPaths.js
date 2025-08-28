import express from 'express';
import { LearningPath, Resource, User, Progress } from '../models/index.js';
import { authenticate, isInstructor } from '../middleware/auth.js';

const router = express.Router();

/**
 * Route: GET /api/learning-paths
 * Description: Get all public learning paths
 * Access: Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    
    // Build query conditions
    const whereConditions = { isPublic: true };
    
    if (category) {
      whereConditions.category = category;
    }
    
    if (difficulty) {
      whereConditions.difficulty = difficulty;
    }
    
    if (search) {
      whereConditions[LearningPath.sequelize.Op.or] = [
        { title: { [LearningPath.sequelize.Op.like]: `%${search}%` } },
        { description: { [LearningPath.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    
    const learningPaths = await LearningPath.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Resource,
          as: 'resources',
          attributes: ['id', 'title', 'type', 'estimatedTimeMinutes']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: learningPaths.length,
      learningPaths
    });
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: POST /api/learning-paths
 * Description: Create a new learning path
 * Access: Private (requires instructor role)
 */
router.post('/', authenticate, isInstructor, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      difficulty, 
      estimatedTimeHours,
      isPublic,
      coverImage
    } = req.body;
    
    const learningPath = await LearningPath.create({
      title,
      description,
      category,
      difficulty,
      estimatedTimeHours,
      isPublic: isPublic !== undefined ? isPublic : true,
      coverImage,
      creatorId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: 'Learning path created successfully',
      learningPath
    });
  } catch (error) {
    console.error('Error creating learning path:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: GET /api/learning-paths/:id
 * Description: Get a learning path by ID
 * Access: Public for public paths, Private for private paths
 */
router.get('/:id', async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Resource,
          as: 'resources',
          attributes: ['id', 'title', 'description', 'type', 'format', 'url', 'filePath', 'estimatedTimeMinutes', 'order', 'isRequired', 'metadata'],
          order: [['order', 'ASC']]
        }
      ]
    });
    
    if (!learningPath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning path not found' 
      });
    }
    
    // Check if learning path is private and user is not authenticated
    if (!learningPath.isPublic && (!req.user || (req.user.id !== learningPath.creatorId && req.user.role !== 'admin'))) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This learning path is private.' 
      });
    }
    
    // Calculate total estimated time
    const totalEstimatedMinutes = learningPath.resources.reduce(
      (total, resource) => total + resource.estimatedTimeMinutes, 
      0
    );
    
    res.json({
      success: true,
      learningPath: {
        ...learningPath.toJSON(),
        totalEstimatedMinutes
      }
    });
  } catch (error) {
    console.error('Error fetching learning path:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: PUT /api/learning-paths/:id
 * Description: Update a learning path
 * Access: Private (requires instructor role and ownership)
 */
router.put('/:id', authenticate, isInstructor, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      difficulty, 
      estimatedTimeHours,
      isPublic,
      coverImage
    } = req.body;
    
    const learningPath = await LearningPath.findByPk(req.params.id);
    
    if (!learningPath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning path not found' 
      });
    }
    
    // Check if user is the creator or an admin
    if (learningPath.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update your own learning paths.' 
      });
    }
    
    // Update fields
    if (title) learningPath.title = title;
    if (description !== undefined) learningPath.description = description;
    if (category !== undefined) learningPath.category = category;
    if (difficulty) learningPath.difficulty = difficulty;
    if (estimatedTimeHours !== undefined) learningPath.estimatedTimeHours = estimatedTimeHours;
    if (isPublic !== undefined) learningPath.isPublic = isPublic;
    if (coverImage !== undefined) learningPath.coverImage = coverImage;
    
    await learningPath.save();
    
    res.json({
      success: true,
      message: 'Learning path updated successfully',
      learningPath
    });
  } catch (error) {
    console.error('Error updating learning path:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: DELETE /api/learning-paths/:id
 * Description: Delete a learning path
 * Access: Private (requires instructor role and ownership)
 */
router.delete('/:id', authenticate, isInstructor, async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id);
    
    if (!learningPath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning path not found' 
      });
    }
    
    // Check if user is the creator or an admin
    if (learningPath.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete your own learning paths.' 
      });
    }
    
    await learningPath.destroy();
    
    res.json({
      success: true,
      message: 'Learning path deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting learning path:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: GET /api/learning-paths/instructor/my-paths
 * Description: Get all learning paths created by the current instructor
 * Access: Private (requires instructor role)
 */
router.get('/instructor/my-paths', authenticate, isInstructor, async (req, res) => {
  try {
    const learningPaths = await LearningPath.findAll({
      where: { creatorId: req.user.id },
      include: [
        {
          model: Resource,
          as: 'resources',
          attributes: ['id', 'title', 'type', 'estimatedTimeMinutes']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: learningPaths.length,
      learningPaths
    });
  } catch (error) {
    console.error('Error fetching instructor learning paths:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: POST /api/learning-paths/:id/enroll
 * Description: Enroll in a learning path
 * Access: Private
 */
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const learningPath = await LearningPath.findByPk(req.params.id, {
      include: [
        {
          model: Resource,
          as: 'resources',
          attributes: ['id']
        }
      ]
    });
    
    if (!learningPath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning path not found' 
      });
    }
    
    // Check if learning path is private and user is not the creator or admin
    if (!learningPath.isPublic && req.user.id !== learningPath.creatorId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This learning path is private.' 
      });
    }
    
    // Create progress records for each resource in the learning path
    const progressRecords = [];
    
    for (const resource of learningPath.resources) {
      // Check if progress record already exists
      const existingProgress = await Progress.findOne({
        where: {
          userId: req.user.id,
          learningPathId: learningPath.id,
          resourceId: resource.id
        }
      });
      
      if (!existingProgress) {
        const progress = await Progress.create({
          userId: req.user.id,
          learningPathId: learningPath.id,
          resourceId: resource.id,
          status: 'not_started',
          completionPercentage: 0,
          timeSpentMinutes: 0
        });
        
        progressRecords.push(progress);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Enrolled in learning path successfully',
      progressRecords
    });
  } catch (error) {
    console.error('Error enrolling in learning path:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;