import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { CircularProgress, Box } from '@mui/material';
import Dashboard from './components/dashboard/Dashboard';
import CreateLearningPath from './components/instructor/CreateLearningPath';
import LearningPaths from './components/learning/LearningPaths';
import LearningPathDetail from './components/learning/LearningPathDetail';
import Resources from './components/resources/Resources';
import Profile from './components/profile/Profile';
import InstructorPaths from './components/instructor/InstructorPaths';
import ManageUsers from './components/admin/ManageUsers';
import Settings from './components/admin/Settings';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Role-based route component
const RoleRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="learning-paths" element={<LearningPaths />} />
        <Route path="learning-paths/:id" element={<LearningPathDetail />} />
        <Route path="resources" element={<Resources />} />
        <Route path="profile" element={<Profile />} />

        {/* Instructor routes */}
        <Route 
          path="instructor/create-path" 
          element={
            <RoleRoute roles={['instructor', 'admin']}>
              <CreateLearningPath />
            </RoleRoute>
          } 
        />
        <Route 
          path="instructor/my-paths" 
          element={
            <RoleRoute roles={['instructor', 'admin']}>
              <InstructorPaths />
            </RoleRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="admin/users" 
          element={
            <RoleRoute roles={['admin']}>
              <ManageUsers />
            </RoleRoute>
          } 
        />
        <Route 
          path="admin/settings" 
          element={
            <RoleRoute roles={['admin']}>
              <Settings />
            </RoleRoute>
          } 
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
