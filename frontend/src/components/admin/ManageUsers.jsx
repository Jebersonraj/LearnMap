// New frontend/src/components/admin/ManageUsers.jsx
// Create this file in src/components/admin/

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
    Alert,
    Select,
    MenuItem,
    Button
} from '@mui/material';

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/users');
                setUsers(response.data.users);
            } catch (err) {
                setError('Failed to load users.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/users/${userId}`, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            setError('Failed to update role.');
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Manage Users</Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}>
                                    <MenuItem value="learner">Learner</MenuItem>
                                    <MenuItem value="instructor">Instructor</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                            </TableCell>
                            <TableCell>
                                <Button>Delete</Button> {/* Add delete functionality */}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Container>
    );
}