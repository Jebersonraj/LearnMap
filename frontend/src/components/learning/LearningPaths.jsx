// Complete updated frontend/src/components/learning/LearningPaths.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    CircularProgress,
    Alert,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box
} from '@mui/material';

export default function LearningPaths() {
    const [learningPaths, setLearningPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ category: '', difficulty: '', search: '' });
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
        fetchLearningPaths();
    }, [filters]);

    const fetchCategories = async () => {
        try {
            // Assuming backend has an endpoint for categories; if not, you can derive from all paths
            // For now, hardcode or fetch from all paths
            const response = await axios.get('/api/learning-paths');
            const uniqueCategories = [...new Set(response.data.learningPaths.map(p => p.category).filter(c => c))];
            setCategories(uniqueCategories);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const fetchLearningPaths = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams(filters);
            const response = await axios.get(`/api/learning-paths?${params.toString()}`);
            setLearningPaths(Array.isArray(response.data.learningPaths) ? response.data.learningPaths : []);
        } catch (err) {
            setError('Failed to load learning paths. Please try again.');
            console.error('Error fetching learning paths:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
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

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Available Learning Paths</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Search"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select name="category" value={filters.category} onChange={handleFilterChange}>
                            <MenuItem value="">All</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel>Difficulty</InputLabel>
                        <Select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="beginner">Beginner</MenuItem>
                            <MenuItem value="intermediate">Intermediate</MenuItem>
                            <MenuItem value="advanced">Advanced</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {learningPaths.length === 0 ? (
                <Alert severity="info">No learning paths found. Try adjusting your filters.</Alert>
            ) : (
                <Grid container spacing={3}>
                    {learningPaths.map(path => (
                        <Grid item xs={12} sm={6} md={4} key={path.id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5">{path.title}</Typography>
                                    <Typography color="textSecondary">{path.description}</Typography>
                                    <Typography>Difficulty: {path.difficulty}</Typography>
                                    <Typography>Estimated Time: {path.estimatedTimeHours} hours</Typography>
                                    <Typography>Created by: {path.creator?.username || 'Unknown'}</Typography>
                                </CardContent>
                                <CardActions>
                                    <Button onClick={() => navigate(`/learning-paths/${path.id}`)}>View Details</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}