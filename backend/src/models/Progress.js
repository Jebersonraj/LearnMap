import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import LearningPath from './LearningPath.js';
import Resource from './Resource.js';

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  learningPathId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: LearningPath,
      key: 'id',
    },
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Resource,
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
    defaultValue: 'not_started',
    allowNull: false,
  },
  completionPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 100,
    },
  },
  timeSpentMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Define associations
Progress.belongsTo(User, { 
  foreignKey: 'userId', 
  onDelete: 'CASCADE' 
});

Progress.belongsTo(LearningPath, { 
  foreignKey: 'learningPathId', 
  onDelete: 'CASCADE' 
});

Progress.belongsTo(Resource, { 
  foreignKey: 'resourceId', 
  onDelete: 'CASCADE' 
});

User.hasMany(Progress, { 
  foreignKey: 'userId', 
  as: 'progressRecords' 
});

LearningPath.hasMany(Progress, { 
  foreignKey: 'learningPathId', 
  as: 'learnerProgress' 
});

Resource.hasMany(Progress, { 
  foreignKey: 'resourceId', 
  as: 'resourceProgress' 
});

// Add a unique constraint to ensure one progress record per user-resource combination
Progress.addHook('beforeValidate', async (progress) => {
  const existingProgress = await Progress.findOne({
    where: {
      userId: progress.userId,
      resourceId: progress.resourceId,
    },
  });

  if (existingProgress && existingProgress.id !== progress.id) {
    throw new Error('A progress record already exists for this user and resource');
  }
});

export default Progress;