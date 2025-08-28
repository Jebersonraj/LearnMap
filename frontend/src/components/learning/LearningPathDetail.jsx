// Complete updated frontend/src/components/learning/LearningPathDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    CircularProgress,
    Alert,
    LinearProgress,
    Chip,
    Divider
} from '@mui/material';
import { CheckCircle, PlayCircle, Description, AccessTime, School, Person } from '@mui/icons-material';

export default function LearningPathDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [path, setPath] = useState(null);
    const [resources, setResources] = useState([]);
    const [progress, setProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [pathRes, resourcesRes, progressRes] = await Promise.all([
                axios.get(`/api/learning-paths/${id}`),
                axios.get(`/api/resources?learningPathId=${id}`),
                axios.get(`/api/progress?learningPathId=${id}`)
            ]);
            setPath(pathRes.data.learningPath);
            setResources(resourcesRes.data.resources || []);
            setProgress(progressRes.data.progress || []);
        } catch (err) {
            setError('Failed to load learning path details. Please try again.');
            console.error('Error fetching learning path details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartResource = async (resourceId) => {
        try {
            // Update progress to 'in_progress'
            await axios.post('/api/progress', {
                resourceId,
                learningPathId: id,
                status: 'in_progress'
            });
            // Refresh progress
            const progressRes = await axios.get(`/api/progress?learningPathId=${id}`);
            setProgress(progressRes.data.progress);
        } catch (err) {
            console.error('Error starting resource:', err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!path) {
        return <Alert severity="info">Learning path not found.</Alert>;
    }

    return (
        <Container>
            <Typography variant="h4" gutterBottom>{path.title}</Typography>
            <Typography variant="body1" paragraph>{path.description}</Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Chip icon={<School />} label={`Difficulty: ${path.difficulty}`} />
                <Chip icon={<AccessTime />} label={`Est. Time: ${path.estimatedTimeHours} hours`} />
                <Chip icon={<Person />} label={`Creator: ${path.creator?.username || 'Unknown'}`} />
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>Resources ({resources.length})</Typography>

            {resources.length === 0 ? (
                <Alert severity="info">No resources available in this learning path.</Alert>
            ) : (
                <List>
                    {resources.map((resource) => {
                        const resProgress = progress.find(p => p.resourceId === resource.id) || {
                            status: 'not_started',
                            completionPercentage: 0,
                            timeSpentMinutes: 0
                        };
                        return (
                            <ListItem key={resource.id} divider>
                                <ListItemIcon>
                                    {resProgress.status === 'completed' ? <CheckCircle color="success" /> :
                                        resProgress.status === 'in_progress' ? <PlayCircle color="primary" /> : <Description color="action" />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={resource.title}
                                    secondary={
                                        <>
                                            {resource.description && <Typography variant="body2">{resource.description}</Typography>}
                                            <Typography variant="body2" color="text.secondary">
                                                Type: {resource.type} | Est. Time: {resource.estimatedTimeMinutes} min | {resource.isRequired ? 'Required' : 'Optional'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Status: {resProgress.status.replace('_', ' ')} | Time Spent: {resProgress.timeSpentMinutes} min
                                            </Typography>
                                        </>
                                    }
                                />
                                <Box sx={{ width: 200, mr: 2 }}>
                                    <LinearProgress variant="determinate" value={resProgress.completionPercentage} />
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleStartResource(resource.id)}
                                    disabled={resProgress.status === 'completed'}
                                >
                                    {resProgress.status === 'not_started' ? 'Start' : 'Continue'}
                                </Button>
                            </ListItem>
                        );
                    })}
                </List>
            )}

            <Box sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={() => navigate('/learning-paths')}>
                    Back to Learning Paths
                </Button>
            </Box>
        </Container>
    );
}