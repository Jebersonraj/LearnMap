import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/db.js';
import ensureDatabase from './config/ensureDb.js';
import { User, LearningPath, Resource, Progress } from './models/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import learningPathRoutes from './routes/learningPaths.js';
import progressRoutes from './routes/progress.js';
import resourceRoutes from './routes/resources.js';
import uploadRoutes from './routes/uploads.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../Uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/learning-paths', learningPathRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/', (req, res) => {
    res.send('Learning Path Dashboard API is running');
});

// Sync database models in order
async function syncDatabase() {
    try {
        // First ensure the database exists
        console.log('Ensuring database exists...');
        const dbCreated = await ensureDatabase();
        if (!dbCreated) {
            throw new Error('Failed to ensure database exists');
        }

        // Check if database connection is working
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync models in order of dependencies
        console.log('Syncing User model...');
        await User.sync({ alter: true });

        console.log('Syncing LearningPath model...');
        await LearningPath.sync({ alter: true });

        console.log('Syncing Resource model...');
        await Resource.sync({ alter: true });

        console.log('Syncing Progress model...');
        await Progress.sync({ alter: true });

        console.log('All database models synced successfully');
        return true;
    } catch (err) {
        console.error('Database sync error:', err);
        if (err.name === 'SequelizeConnectionError') {
            console.error('Could not connect to the database. Please check your database server is running and credentials are correct.');
        } else if (err.name === 'SequelizeForeignKeyConstraintError') {
            console.error('Foreign key constraint error. Check that your model relationships are correctly defined.');
        }
        throw err;
    }
}

// Start server after syncing
syncDatabase()
    .then((success) => {
        if (success) {
            app.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`);
                console.log(`API available at http://localhost:${PORT}`);
            });
        }
    })
    .catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1); // Exit with error code
    });

export default app;
