import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import bibtexParse from 'bibtex-parser-js';
import { authenticate, isInstructor } from '../middleware/auth.js';
import { LearningPath, Resource } from '../models/index.js';

const router = express.Router();

// Set up file storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const resourcesDir = path.join(uploadsDir, 'resources');
const importsDir = path.join(uploadsDir, 'imports');

if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

if (!fs.existsSync(importsDir)) {
  fs.mkdirSync(importsDir, { recursive: true });
}

// Configure multer storage for resources
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resourcesDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure multer storage for imports
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, importsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for resources
const resourceFilter = (req, file, cb) => {
  // Accept documents, videos, and images
  const allowedTypes = [
    // Documents
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt',
    // Videos
    '.mp4', '.webm', '.avi', '.mov', '.wmv',
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.svg'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed types: ' + allowedTypes.join(', ')));
  }
};

// File filter for imports
const importFilter = (req, file, cb) => {
  // Accept only Excel and BibTeX files
  const allowedTypes = ['.xlsx', '.xls', '.bib', '.bibtex'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed types: ' + allowedTypes.join(', ')));
  }
};

// Set up multer upload for resources
const uploadResource = multer({
  storage: resourceStorage,
  fileFilter: resourceFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Set up multer upload for imports
const uploadImport = multer({
  storage: importStorage,
  fileFilter: importFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Route: POST /api/uploads/resource
 * Description: Upload a resource file
 * Access: Private (requires instructor role)
 */
router.post('/resource', authenticate, isInstructor, uploadResource.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    // Get file information
    const { filename, path: filePath, originalname, mimetype, size } = req.file;
    const fileExtension = path.extname(originalname).toLowerCase();
    
    // Determine file type
    let fileType = 'document';
    if (['.mp4', '.webm', '.avi', '.mov', '.wmv'].includes(fileExtension)) {
      fileType = 'video';
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(fileExtension)) {
      fileType = 'image';
    }
    
    // Calculate estimated reading/viewing time based on file type and size
    let estimatedTimeMinutes = 0;
    
    if (fileType === 'document') {
      // Rough estimate: 1MB = 10 pages, 1 page = 2 minutes
      estimatedTimeMinutes = Math.ceil((size / (1024 * 1024)) * 10 * 2);
    } else if (fileType === 'video') {
      // For videos, we can't accurately determine length without processing
      // So we'll use a placeholder value that can be updated later
      estimatedTimeMinutes = 30;
    } else {
      // For images, just a few minutes
      estimatedTimeMinutes = 2;
    }
    
    // Return file information
    res.json({
      success: true,
      file: {
        filename,
        filePath: `/uploads/resources/${filename}`,
        originalname,
        mimetype,
        size,
        fileType,
        format: fileExtension.substring(1), // Remove the dot
        estimatedTimeMinutes
      }
    });
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: POST /api/uploads/import
 * Description: Import learning resources from Excel or BibTeX file
 * Access: Private (requires instructor role)
 */
router.post('/import', authenticate, isInstructor, uploadImport.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    const { filename, path: filePath, originalname } = req.file;
    const fileExtension = path.extname(originalname).toLowerCase();
    
    let resources = [];
    
    // Parse file based on extension
    if (['.xlsx', '.xls'].includes(fileExtension)) {
      // Parse Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      // Map Excel data to resources
      resources = data.map((row, index) => {
        return {
          title: row.title || `Resource ${index + 1}`,
          description: row.description || '',
          type: row.type || 'document',
          format: row.format || '',
          url: row.url || '',
          estimatedTimeMinutes: row.estimatedTimeMinutes || 30,
          order: row.order || index,
          isRequired: row.isRequired !== undefined ? row.isRequired : true,
          metadata: {
            authors: row.authors || '',
            publisher: row.publisher || '',
            year: row.year || '',
            source: 'Excel Import'
          }
        };
      });
    } else if (['.bib', '.bibtex'].includes(fileExtension)) {
      // Parse BibTeX file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const bibtexData = bibtexParse.toJSON(fileContent);
      
      // Map BibTeX data to resources
      resources = bibtexData.map((entry, index) => {
        const { entryType, entryTags } = entry;
        
        return {
          title: entryTags.title || `Resource ${index + 1}`,
          description: entryTags.abstract || '',
          type: 'document',
          format: 'pdf',
          url: entryTags.url || entryTags.doi ? `https://doi.org/${entryTags.doi}` : '',
          estimatedTimeMinutes: 60, // Default for academic papers
          order: index,
          isRequired: true,
          metadata: {
            authors: entryTags.author || '',
            publisher: entryTags.publisher || entryTags.journal || '',
            year: entryTags.year || '',
            doi: entryTags.doi || '',
            entryType,
            source: 'BibTeX Import'
          }
        };
      });
    }
    
    // Return parsed resources
    res.json({
      success: true,
      resources,
      file: {
        filename,
        filePath: `/uploads/imports/${filename}`,
        originalname
      }
    });
  } catch (error) {
    console.error('Error importing resources:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: POST /api/uploads/import/learning-path
 * Description: Create a learning path from imported resources
 * Access: Private (requires instructor role)
 */
router.post('/import/learning-path', authenticate, isInstructor, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      difficulty, 
      isPublic,
      resources 
    } = req.body;
    
    if (!title || !resources || !Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request. Title and resources array are required.' 
      });
    }
    
    // Create learning path
    const learningPath = await LearningPath.create({
      title,
      description,
      category,
      difficulty: difficulty || 'intermediate',
      isPublic: isPublic !== undefined ? isPublic : true,
      creatorId: req.user.id
    });
    
    // Create resources
    const createdResources = [];
    
    for (const [index, resource] of resources.entries()) {
      const createdResource = await Resource.create({
        ...resource,
        order: resource.order !== undefined ? resource.order : index,
        learningPathId: learningPath.id
      });
      
      createdResources.push(createdResource);
    }
    
    // Update learning path's estimated time
    const totalMinutes = createdResources.reduce(
      (total, resource) => total + resource.estimatedTimeMinutes, 
      0
    );
    
    learningPath.estimatedTimeHours = totalMinutes / 60;
    await learningPath.save();
    
    res.status(201).json({
      success: true,
      message: 'Learning path created successfully from imported resources',
      learningPath,
      resources: createdResources
    });
  } catch (error) {
    console.error('Error creating learning path from imports:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: DELETE /api/uploads/resource/:filename
 * Description: Delete an uploaded resource file
 * Access: Private (requires instructor role)
 */
router.delete('/resource/:filename', authenticate, isInstructor, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(resourcesDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }
    
    // Delete file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * Route: DELETE /api/uploads/import/:filename
 * Description: Delete an imported file
 * Access: Private (requires instructor role)
 */
router.delete('/import/:filename', authenticate, isInstructor, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(importsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found' 
      });
    }
    
    // Delete file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
  }
});

// Error handler for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB for resources and 10MB for imports.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
  next();
});

export default router;