// New frontend/src/components/resources/Resources.jsx
// Create this file in src/components/resources/

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';

export default function Resources() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/resources');
                setResources(response.data.resources);
            } catch (err) {
                setError('Failed to load resources.');
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Resources</Typography>
            <Grid container spacing={3}>
                {resources.map(resource => (
                    <Grid item xs={12} sm={6} md={4} key={resource.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5">{resource.title}</Typography>
                                <Typography>{resource.description}</Typography>
                                <Typography>Type: {resource.type}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}