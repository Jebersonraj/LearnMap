import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import LearningPath from './LearningPath.js';

const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('document', 'video', 'link', 'other'),
    allowNull: false,
    defaultValue: 'document',
  },
  format: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'File format (pdf, docx, mp4, etc.) or website for links',
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
    comment: 'URL for external resources',
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to uploaded file for local resources',
  },
  estimatedTimeMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Estimated time to complete the resource in minutes',
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Order of the resource within the learning path',
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  learningPathId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: LearningPath,
      key: 'id',
    },
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata about the resource (authors, publication date, etc.)',
  },
});

// Define associations
Resource.belongsTo(LearningPath, { 
  foreignKey: 'learningPathId', 
  onDelete: 'CASCADE' 
});

LearningPath.hasMany(Resource, { 
  foreignKey: 'learningPathId', 
  as: 'resources' 
});

export default Resource;