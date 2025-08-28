// New frontend/src/components/instructor/InstructorPaths.jsx
// Create this file in src/components/instructor/

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';

export default function InstructorPaths() {
    const [paths, setPaths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaths = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/learning-paths/my');
                setPaths(response.data.learningPaths);
            } catch (err) {
                setError('Failed to load your learning paths.');
            } finally {
                setLoading(false);
            }
        };
        fetchPaths();
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container>
            <Typography variant="h4" gutterBottom>My Learning Paths</Typography>
            <Grid container spacing={3}>
                {paths.map(path => (
                    <Grid item xs={12} sm={6} md={4} key={path.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5">{path.title}</Typography>
                                <Typography>Resources: {path.resources.length}</Typography>
                                <Typography>Estimated Time: {path.estimatedTimeHours} hours</Typography>
                            </CardContent>
                            <CardActions>
                                <Button>Edit</Button> {/* Add edit functionality */}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}