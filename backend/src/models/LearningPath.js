import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';

const LearningPath = sequelize.define('LearningPath', {
  id: {
    type: DataTypes.INTEGER, // Must match User.id
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [3, 100] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'intermediate',
    allowNull: false,
  },
  estimatedTimeHours: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  creatorId: {
    type: DataTypes.INTEGER, // Must match User.id
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
  },
});

// Associations
LearningPath.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

export default LearningPath;
