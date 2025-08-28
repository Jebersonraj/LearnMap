import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

// Step components
const BasicInfo = ({ formData, setFormData, errors }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Learning Path Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="difficulty-label">Difficulty</InputLabel>
            <Select
              labelId="difficulty-label"
              name="difficulty"
              value={formData.difficulty}
              label="Difficulty"
              onChange={handleChange}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="visibility-label">Visibility</InputLabel>
            <Select
              labelId="visibility-label"
              name="isPublic"
              value={formData.isPublic}
              label="Visibility"
              onChange={handleChange}
            >
              <MenuItem value={true}>Public</MenuItem>
              <MenuItem value={false}>Private</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

const AddResources = ({ resources, setResources }) => {
  const [resourceType, setResourceType] = useState('link');
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    type: 'document',
    format: '',
    url: '',
    estimatedTimeMinutes: 30,
    isRequired: true
  });
  const [errors, setErrors] = useState({});

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      console.log('Files dropped:', acceptedFiles);
      // In a real implementation, you would upload these files to the server
      // For now, we'll just update the UI
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setResourceData(prev => ({
          ...prev,
          title: file.name,
          format: file.name.split('.').pop(),
          filePath: URL.createObjectURL(file), // This is just for preview
          file: file // Store the actual file for later upload
        }));
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'text/plain': ['.txt'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false
  });

  const handleResourceTypeChange = (e) => {
    setResourceType(e.target.value);
    setResourceData(prev => ({
      ...prev,
      url: '',
      filePath: '',
      file: null
    }));
  };

  const handleResourceDataChange = (e) => {
    const { name, value } = e.target;
    setResourceData(prev => ({ ...prev, [name]: value }));
  };

  const validateResource = () => {
    const newErrors = {};
    
    if (!resourceData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (resourceType === 'link' && !resourceData.url.trim()) {
      newErrors.url = 'URL is required';
    }
    
    if (resourceType === 'upload' && !resourceData.file) {
      newErrors.file = 'File is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddResource = () => {
    if (!validateResource()) return;
    
    const newResource = {
      ...resourceData,
      id: Date.now(), // Temporary ID for UI purposes
      order: resources.length
    };
    
    setResources(prev => [...prev, newResource]);
    
    // Reset form
    setResourceData({
      title: '',
      description: '',
      type: 'document',
      format: '',
      url: '',
      estimatedTimeMinutes: 30,
      isRequired: true
    });
  };

  const handleRemoveResource = (id) => {
    setResources(prev => prev.filter(resource => resource.id !== id));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Add Resources
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="resource-type-label">Resource Type</InputLabel>
              <Select
                labelId="resource-type-label"
                value={resourceType}
                label="Resource Type"
                onChange={handleResourceTypeChange}
              >
                <MenuItem value="link">External Link</MenuItem>
                <MenuItem value="upload">Upload File</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Resource Title"
              name="title"
              value={resourceData.title}
              onChange={handleResourceDataChange}
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={2}
              value={resourceData.description}
              onChange={handleResourceDataChange}
            />
          </Grid>
          
          {resourceType === 'link' ? (
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="URL"
                name="url"
                value={resourceData.url}
                onChange={handleResourceDataChange}
                error={!!errors.url}
                helperText={errors.url}
                InputProps={{
                  startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Box 
                {...getRootProps()} 
                sx={{ 
                  border: '2px dashed #ccc', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                  ...(errors.file && { borderColor: 'error.main' })
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography>
                  Drag & drop a file here, or click to select a file
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Supported formats: PDF, Word, PowerPoint, Excel, Text, Video, Images
                </Typography>
                {resourceData.file && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                    Selected: {resourceData.file.name}
                  </Typography>
                )}
                {errors.file && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {errors.file}
                  </Typography>
                )}
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="resource-content-type-label">Content Type</InputLabel>
              <Select
                labelId="resource-content-type-label"
                name="type"
                value={resourceData.type}
                label="Content Type"
                onChange={handleResourceDataChange}
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="link">Link</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Time (minutes)"
              name="estimatedTimeMinutes"
              type="number"
              value={resourceData.estimatedTimeMinutes}
              onChange={handleResourceDataChange}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="required-label">Required</InputLabel>
              <Select
                labelId="required-label"
                name="isRequired"
                value={resourceData.isRequired}
                label="Required"
                onChange={handleResourceDataChange}
              >
                <MenuItem value={true}>Required</MenuItem>
                <MenuItem value={false}>Optional</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddResource}
              fullWidth
            >
              Add Resource
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="h6" gutterBottom>
        Resources ({resources.length})
      </Typography>
      
      {resources.length === 0 ? (
        <Alert severity="info">
          No resources added yet. Add at least one resource to continue.
        </Alert>
      ) : (
        <List>
          {resources.map((resource, index) => (
            <ListItem
              key={resource.id}
              sx={{ 
                mb: 1, 
                border: '1px solid #eee', 
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <DragIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={resource.title}
                secondary={
                  <>
                    <Typography variant="body2" component="span">
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • 
                      {resource.estimatedTimeMinutes} min • 
                      {resource.isRequired ? 'Required' : 'Optional'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resource.description}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleRemoveResource(resource.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

const Review = ({ formData, resources }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Learning Path
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {formData.title}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {formData.description}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Category</Typography>
              <Typography variant="body2">{formData.category || 'None'}</Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Difficulty</Typography>
              <Typography variant="body2">
                {formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2">Visibility</Typography>
              <Typography variant="body2">
                {formData.isPublic ? 'Public' : 'Private'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Typography variant="h6" gutterBottom>
        Resources ({resources.length})
      </Typography>
      
      {resources.map((resource, index) => (
        <Card key={resource.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">
              {index + 1}. {resource.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {resource.description}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2">Type</Typography>
                <Typography variant="body2">
                  {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2">Estimated Time</Typography>
                <Typography variant="body2">
                  {resource.estimatedTimeMinutes} minutes
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2">Required</Typography>
                <Typography variant="body2">
                  {resource.isRequired ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="subtitle2">Source</Typography>
                <Typography variant="body2">
                  {resource.url ? 'External Link' : 'Uploaded File'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
      
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
        Total Estimated Time: {resources.reduce((total, r) => total + parseInt(r.estimatedTimeMinutes), 0)} minutes
      </Typography>
    </Box>
  );
};

export default function CreateLearningPath() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'intermediate',
    isPublic: true
  });
  const [resources, setResources] = useState([]);
  const [errors, setErrors] = useState({});

  const steps = ['Basic Information', 'Add Resources', 'Review & Create'];

  const validateStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
    } else if (activeStep === 1) {
      if (resources.length === 0) {
        setError('Please add at least one resource to continue');
        return false;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create learning path
      const learningPathResponse = await axios.post('http://localhost:5000/api/learning-paths', formData);
      const learningPathId = learningPathResponse.data.learningPath.id;
      
      // Add resources to learning path
      for (const resource of resources) {
        // If resource has a file, upload it first
        if (resource.file) {
          const formData = new FormData();
          formData.append('file', resource.file);
          
          const uploadResponse = await axios.post('http://localhost:5000/api/uploads/resource', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Update resource with file information
          resource.filePath = uploadResponse.data.file.filePath;
          resource.format = uploadResponse.data.file.format;
          delete resource.file; // Remove file object before sending to API
        }
        
        // Add resource to learning path
        await axios.post('http://localhost:5000/api/resources', {
          ...resource,
          learningPathId
        });
      }
      
      // Navigate to the learning path page
      navigate(`/learning-paths/${learningPathId}`);
    } catch (error) {
      console.error('Error creating learning path:', error);
      setError(error.response?.data?.message || 'Failed to create learning path. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create Learning Path
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === 0 && (
          <BasicInfo formData={formData} setFormData={setFormData} errors={errors} />
        )}
        
        {activeStep === 1 && (
          <AddResources resources={resources} setResources={setResources} />
        )}
        
        {activeStep === 2 && (
          <Review formData={formData} resources={resources} />
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0 || isSubmitting}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Create Learning Path'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}