// New frontend/src/components/profile/Profile.jsx
// Create this file in src/components/profile/

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Avatar,
    CircularProgress,
    Alert
} from '@mui/material';

export default function Profile() {
    const { user, updateProfile, error: authError } = useAuth();
    const [formData, setFormData] = useState({ firstName: '', lastName: '', profilePicture: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                profilePicture: user.profilePicture || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(formData);
            setSuccess('Profile updated successfully');
        } catch (err) {
            // Error handled by useAuth
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h4" gutterBottom>Profile</Typography>
                {authError && <Alert severity="error">{authError}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
                <form onSubmit={handleSubmit}>
                    <Avatar src={formData.profilePicture} sx={{ width: 100, height: 100, mb: 2 }} />
                    <TextField fullWidth label="Profile Picture URL" name="profilePicture" value={formData.profilePicture} onChange={handleChange} margin="normal" />
                    <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} margin="normal" />
                    <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} margin="normal" />
                    <Button type="submit" variant="contained" fullWidth disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}