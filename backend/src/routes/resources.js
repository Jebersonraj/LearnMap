import express from 'express';
import { Resource, LearningPath, User } from '../models/index.js';
import { authenticate, isInstructor } from '../middleware/auth.js';

const router = express.Router();

/**
 * Route: GET /api/resources
 * Description: Get all resources (with optional filtering)
 * Access: Private (requires instructor role)
 */
router.get('/', authenticate, isInstructor, async (req, res) => {
  try {
    const { type, format, search, learningPathId } = req.query;
    
    // Build query conditions
    const whereConditions = {};
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (format) {
      whereConditions.format = format;
    }
    
    if (learningPathId) {
      whereConditions.learningPathId = learningPathId;
    }
    
    if (search) {
      whereConditions[Resource.sequelize.Op.or] = [
        { title: { [Resource.sequelize.Op.like]: `%${search}%` } },
        { description: { [Resource.sequelize.Op.like]: `%${search}%` } }
      ];
    }
    
    const resources = await Resource.findAll({
      where: whereConditions,
      include: [
        {
          model: LearningPath,
          as: 'LearningPath',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: POST /api/resources
 * Description: Create a new resource in a learning path
 * Access: Private (requires instructor role and ownership of the learning path)
 */
router.post('/', authenticate, isInstructor, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      format, 
      url,
      filePath,
      estimatedTimeMinutes,
      order,
      isRequired,
      learningPathId,
      metadata
    } = req.body;
    
    // Check if learning path exists and user is the creator
    const learningPath = await LearningPath.findByPk(learningPathId);
    
    if (!learningPath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning path not found' 
      });
    }
    
    if (learningPath.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only add resources to your own learning paths.' 
      });
    }
    
    // Create resource
    const resource = await Resource.create({
      title,
      description,
      type,
      format,
      url,
      filePath,
      estimatedTimeMinutes: estimatedTimeMinutes || 30,
      order: order || 0,
      isRequired: isRequired !== undefined ? isRequired : true,
      learningPathId,
      metadata
    });
    
    // Update learning path's estimated time
    const allResources = await Resource.findAll({
      where: { learningPathId }
    });
    
    const totalMinutes = allResources.reduce(
      (total, resource) => total + resource.estimatedTimeMinutes, 
      0
    );
    
    learningPath.estimatedTimeHours = totalMinutes / 60;
    await learningPath.save();
    
    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: GET /api/resources/:id
 * Description: Get a resource by ID
 * Access: Public for resources in public learning paths, Private for resources in private learning paths
 */
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        {
          model: LearningPath,
          as: 'LearningPath',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        }
      ]
    });
    
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }
    
    // Check if learning path is private and user is not authenticated
    if (!resource.LearningPath.isPublic && (!req.user || (req.user.id !== resource.LearningPath.creatorId && req.user.role !== 'admin'))) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This resource belongs to a private learning path.' 
      });
    }
    
    res.json({
      success: true,
      resource
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: PUT /api/resources/:id
 * Description: Update a resource
 * Access: Private (requires instructor role and ownership of the learning path)
 */
router.put('/:id', authenticate, isInstructor, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      format, 
      url,
      filePath,
      estimatedTimeMinutes,
      order,
      isRequired,
      metadata
    } = req.body;
    
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        {
          model: LearningPath,
          as: 'LearningPath'
        }
      ]
    });
    
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }
    
    // Check if user is the creator of the learning path or an admin
    if (resource.LearningPath.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update resources in your own learning paths.' 
      });
    }
    
    // Update fields
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (format !== undefined) resource.format = format;
    if (url !== undefined) resource.url = url;
    if (filePath !== undefined) resource.filePath = filePath;
    if (estimatedTimeMinutes !== undefined) resource.estimatedTimeMinutes = estimatedTimeMinutes;
    if (order !== undefined) resource.order = order;
    if (isRequired !== undefined) resource.isRequired = isRequired;
    if (metadata !== undefined) resource.metadata = metadata;
    
    await resource.save();
    
    // Update learning path's estimated time
    const allResources = await Resource.findAll({
      where: { learningPathId: resource.learningPathId }
    });
    
    const totalMinutes = allResources.reduce(
      (total, res) => total + res.estimatedTimeMinutes, 
      0
    );
    
    const learningPath = await LearningPath.findByPk(resource.learningPathId);
    learningPath.estimatedTimeHours = totalMinutes / 60;
    await learningPath.save();
    
    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: DELETE /api/resources/:id
 * Description: Delete a resource
 * Access: Private (requires instructor role and ownership of the learning path)
 */
router.delete('/:id', authenticate, isInstructor, async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        {
          model: LearningPath,
          as: 'LearningPath'
        }
      ]
    });
    
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }
    
    // Check if user is the creator of the learning path or an admin
    if (resource.LearningPath.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only delete resources in your own learning paths.' 
      });
    }
    
    const learningPathId = resource.learningPathId;
    
    await resource.destroy();
    
    // Update learning path's estimated time
    const allResources = await Resource.findAll({
      where: { learningPathId }
    });
    
    const totalMinutes = allResources.reduce(
      (total, res) => total + res.estimatedTimeMinutes, 
      0
    );
    
    const learningPath = await LearningPath.findByPk(learningPathId);
    learningPath.estimatedTimeHours = totalMinutes / 60;
    await learningPath.save();
    
    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: PUT /api/resources/reorder
 * Description: Reorder resources in a learning path
 * Access: Private (requires instructor role and ownership of the learning path)
 */
router.put('/reorder', authenticate, isInstructor, async (req, res) => {
  try {
    const { learningPathId, resourceOrders } = req.body;
    
    if (!learningPathId || !resourceOrders || !Array.isArray(resourceOrders)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request. learningPathId and resourceOrders array are required.' 
      });
    }
    
    // Check if learning path exists and user is the creator
    const learningPath = await LearningPath.findByPk(learningPathId);
    
    if (!learningPath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Learning path not found' 
      });
    }
    
    if (learningPath.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only reorder resources in your own learning paths.' 
      });
    }
    
    // Update order for each resource
    for (const { id, order } of resourceOrders) {
      await Resource.update(
        { order },
        { where: { id, learningPathId } }
      );
    }
    
    // Get updated resources
    const resources = await Resource.findAll({
      where: { learningPathId },
      order: [['order', 'ASC']]
    });
    
    res.json({
      success: true,
      message: 'Resources reordered successfully',
      resources
    });
  } catch (error) {
    console.error('Error reordering resources:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;