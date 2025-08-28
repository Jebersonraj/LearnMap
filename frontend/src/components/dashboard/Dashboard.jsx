// Updated frontend/src/components/dashboard/Dashboard.jsx
// Replace the entire file content with this

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircleFilled as PlayCircleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/users/dashboard');
        setDashboardData(response.data.dashboard);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (!dashboardData) {
    return <Alert severity="info">No dashboard data available.</Alert>;
  }

  const { totalPaths, completedPaths, inProgressPaths, totalTimeSpent, progress } = dashboardData;

  // Prepare chart data
  const progressData = progress.map(p => ({
    name: p.learningPath.title,
    Completion: p.overallCompletionPercentage
  }));

  const pieData = [
    { name: 'Completed', value: completedPaths },
    { name: 'In Progress', value: inProgressPaths },
    { name: 'Not Started', value: totalPaths - completedPaths - inProgressPaths }
  ];

  return (
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Welcome, {user.username}!
        </Typography>

        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Learning Paths</Typography>
                <Typography variant="h4">{totalPaths}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Completed Paths</Typography>
                <Typography variant="h4">{completedPaths}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>In Progress</Typography>
                <Typography variant="h4">{inProgressPaths}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total Time Spent</Typography>
                <Typography variant="h4">{Math.round(totalTimeSpent / 60)} hours</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Progress Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Progress Overview</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Completion" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Pie Chart */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Path Status</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Learning Path Progress */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Your Learning Paths</Typography>
              <List>
                {progress.map((pathProgress, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText
                          primary={pathProgress.learningPath.title}
                          secondary={`Completion: ${pathProgress.overallCompletionPercentage.toFixed(1)}% | Time Spent: ${pathProgress.totalTimeSpent} min`}
                      />
                      <LinearProgress variant="determinate" value={pathProgress.overallCompletionPercentage} sx={{ width: '200px', mr: 2 }} />
                      <Button variant="outlined" size="small">Continue</Button>
                    </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
  );
}