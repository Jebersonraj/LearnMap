import express from 'express';
import { Progress, User, LearningPath, Resource } from '../models/index.js';
import { authenticate, isInstructor } from '../middleware/auth.js';

const router = express.Router();

/**
 * Route: GET /api/progress
 * Description: Get current user's progress across all learning paths
 * Access: Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const progress = await Progress.findAll({
      where: { userId: req.user.id },
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
        },
        {
          model: Resource,
          as: 'Resource'
        }
      ]
    });
    
    // Group progress by learning path
    const progressByPath = {};
    
    progress.forEach(item => {
      const pathId = item.learningPathId;
      
      if (!progressByPath[pathId]) {
        progressByPath[pathId] = {
          learningPath: item.LearningPath,
          resources: [],
          totalResources: 0,
          completedResources: 0,
          inProgressResources: 0,
          totalTimeSpent: 0,
          overallCompletionPercentage: 0
        };
      }
      
      progressByPath[pathId].resources.push({
        resource: item.Resource,
        progress: {
          status: item.status,
          completionPercentage: item.completionPercentage,
          timeSpentMinutes: item.timeSpentMinutes,
          lastAccessedAt: item.lastAccessedAt,
          completedAt: item.completedAt,
          notes: item.notes
        }
      });
      
      progressByPath[pathId].totalResources++;
      progressByPath[pathId].totalTimeSpent += item.timeSpentMinutes;
      
      if (item.status === 'completed') {
        progressByPath[pathId].completedResources++;
      } else if (item.status === 'in_progress') {
        progressByPath[pathId].inProgressResources++;
      }
    });
    
    // Calculate overall completion percentage for each learning path
    Object.values(progressByPath).forEach(pathProgress => {
      if (pathProgress.totalResources > 0) {
        pathProgress.overallCompletionPercentage = 
          (pathProgress.completedResources / pathProgress.totalResources) * 100;
      }
    });
    
    res.json({
      success: true,
      progress: Object.values(progressByPath)
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: GET /api/progress/learning-path/:learningPathId
 * Description: Get current user's progress for a specific learning path
 * Access: Private
 */
router.get('/learning-path/:learningPathId', authenticate, async (req, res) => {
  try {
    const { learningPathId } = req.params;
    
    // Check if learning path exists
    const learningPath = await LearningPath.findByPk(learningPathId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Resource,
          as: 'resources',
          attributes: ['id', 'title', 'type', 'estimatedTimeMinutes', 'order', 'isRequired'],
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
    
    // Check if learning path is private and user is not the creator or admin
    if (!learningPath.isPublic && req.user.id !== learningPath.creatorId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This learning path is private.' 
      });
    }
    
    // Get progress for each resource in the learning path
    const progress = await Progress.findAll({
      where: { 
        userId: req.user.id,
        learningPathId
      },
      include: [
        {
          model: Resource,
          as: 'Resource'
        }
      ]
    });
    
    // Map progress to resources
    const resourcesWithProgress = learningPath.resources.map(resource => {
      const resourceProgress = progress.find(p => p.resourceId === resource.id);
      
      return {
        resource,
        progress: resourceProgress ? {
          status: resourceProgress.status,
          completionPercentage: resourceProgress.completionPercentage,
          timeSpentMinutes: resourceProgress.timeSpentMinutes,
          lastAccessedAt: resourceProgress.lastAccessedAt,
          completedAt: resourceProgress.completedAt,
          notes: resourceProgress.notes
        } : null
      };
    });
    
    // Calculate overall statistics
    const totalResources = resourcesWithProgress.length;
    const completedResources = resourcesWithProgress.filter(r => r.progress && r.progress.status === 'completed').length;
    const inProgressResources = resourcesWithProgress.filter(r => r.progress && r.progress.status === 'in_progress').length;
    const totalTimeSpent = resourcesWithProgress.reduce((sum, r) => sum + (r.progress ? r.progress.timeSpentMinutes : 0), 0);
    const overallCompletionPercentage = totalResources > 0 ? (completedResources / totalResources) * 100 : 0;
    
    res.json({
      success: true,
      learningPath,
      progress: {
        resources: resourcesWithProgress,
        stats: {
          totalResources,
          completedResources,
          inProgressResources,
          totalTimeSpent,
          overallCompletionPercentage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching learning path progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: PUT /api/progress/resource/:resourceId
 * Description: Update progress for a specific resource
 * Access: Private
 */
router.put('/resource/:resourceId', authenticate, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { status, completionPercentage, timeSpentMinutes, notes } = req.body;
    
    // Check if resource exists
    const resource = await Resource.findByPk(resourceId, {
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
    
    // Check if learning path is private and user is not the creator or admin
    if (!resource.LearningPath.isPublic && 
        req.user.id !== resource.LearningPath.creatorId && 
        req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. This resource belongs to a private learning path.' 
      });
    }
    
    // Find or create progress record
    let progress = await Progress.findOne({
      where: {
        userId: req.user.id,
        resourceId,
        learningPathId: resource.learningPathId
      }
    });
    
    if (!progress) {
      // Create new progress record if it doesn't exist
      progress = await Progress.create({
        userId: req.user.id,
        resourceId,
        learningPathId: resource.learningPathId,
        status: 'not_started',
        completionPercentage: 0,
        timeSpentMinutes: 0
      });
    }
    
    // Update progress fields
    if (status) {
      progress.status = status;
      
      // If status is completed, set completionPercentage to 100 and completedAt to now
      if (status === 'completed') {
        progress.completionPercentage = 100;
        progress.completedAt = new Date();
      }
    }
    
    if (completionPercentage !== undefined) {
      progress.completionPercentage = completionPercentage;
      
      // If completionPercentage is 100, set status to completed and completedAt to now
      if (completionPercentage === 100 && progress.status !== 'completed') {
        progress.status = 'completed';
        progress.completedAt = new Date();
      }
      // If completionPercentage is between 0 and 100, set status to in_progress
      else if (completionPercentage > 0 && completionPercentage < 100) {
        progress.status = 'in_progress';
      }
    }
    
    if (timeSpentMinutes !== undefined) {
      progress.timeSpentMinutes += timeSpentMinutes;
    }
    
    if (notes !== undefined) {
      progress.notes = notes;
    }
    
    // Always update lastAccessedAt when progress is updated
    progress.lastAccessedAt = new Date();
    
    await progress.save();
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      progress
    });
  } catch (error) {
    console.error('Error updating resource progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: GET /api/progress/instructor/learning-path/:learningPathId
 * Description: Get all users' progress for a specific learning path (instructor only)
 * Access: Private (requires instructor role and ownership of the learning path)
 */
router.get('/instructor/learning-path/:learningPathId', authenticate, isInstructor, async (req, res) => {
  try {
    const { learningPathId } = req.params;
    
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
        message: 'Access denied. You can only view progress for your own learning paths.' 
      });
    }
    
    // Get all resources in the learning path
    const resources = await Resource.findAll({
      where: { learningPathId },
      order: [['order', 'ASC']]
    });
    
    // Get all progress records for the learning path
    const progressRecords = await Progress.findAll({
      where: { learningPathId },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
        {
          model: Resource,
          as: 'Resource'
        }
      ]
    });
    
    // Group progress by user
    const progressByUser = {};
    
    progressRecords.forEach(record => {
      const userId = record.userId;
      
      if (!progressByUser[userId]) {
        progressByUser[userId] = {
          user: record.User,
          resources: [],
          totalResources: resources.length,
          completedResources: 0,
          inProgressResources: 0,
          totalTimeSpent: 0,
          overallCompletionPercentage: 0
        };
      }
      
      progressByUser[userId].resources.push({
        resource: record.Resource,
        progress: {
          status: record.status,
          completionPercentage: record.completionPercentage,
          timeSpentMinutes: record.timeSpentMinutes,
          lastAccessedAt: record.lastAccessedAt,
          completedAt: record.completedAt
        }
      });
      
      progressByUser[userId].totalTimeSpent += record.timeSpentMinutes;
      
      if (record.status === 'completed') {
        progressByUser[userId].completedResources++;
      } else if (record.status === 'in_progress') {
        progressByUser[userId].inProgressResources++;
      }
    });
    
    // Calculate overall completion percentage for each user
    Object.values(progressByUser).forEach(userProgress => {
      if (userProgress.totalResources > 0) {
        userProgress.overallCompletionPercentage = 
          (userProgress.completedResources / userProgress.totalResources) * 100;
      }
    });
    
    res.json({
      success: true,
      learningPath,
      resources,
      userProgress: Object.values(progressByUser)
    });
  } catch (error) {
    console.error('Error fetching instructor learning path progress:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;