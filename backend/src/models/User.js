import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../config/db.js';  // ✅ import from db.js

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { len: [3, 30] },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [6, 100] },
  },
  role: {
    type: DataTypes.ENUM('learner', 'instructor', 'admin'),
    defaultValue: 'learner',
    allowNull: false,
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  profilePicture: DataTypes.STRING,
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default User;
