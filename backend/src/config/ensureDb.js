import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function ensureDatabase() {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    
    // Create connection without database name
    const connection = await mysql.createConnection({
        host: DB_HOST || 'localhost',
        user: DB_USER || 'root',
        password: DB_PASSWORD || 'Jeber@16',
    });
    
    try {
        console.log(`Checking if database '${DB_NAME}' exists...`);
        
        // Try to create the database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
        console.log(`Ensured database '${DB_NAME}' exists.`);
        
        // Grant privileges to the user
        await connection.query(
            `GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'${DB_HOST === 'localhost' ? 'localhost' : '%'}'`
        );
        await connection.query('FLUSH PRIVILEGES');
        console.log(`Granted privileges on '${DB_NAME}' to user '${DB_USER}'.`);
        
        return true;
    } catch (error) {
        console.error('Error ensuring database exists:', error);
        return false;
    } finally {
        await connection.end();
    }
}

export default ensureDatabase;