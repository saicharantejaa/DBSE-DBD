import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CatalogPage from './pages/CatalogPage';
import CourseDetailPage from './pages/CourseDetailPage';
import DoubtSolverPage from './pages/DoubtSolverPage';
import MyDoubtsPage from './pages/MyDoubtsPage';
import InstructorPage from './pages/InstructorPage';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell-main">
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><DashboardPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/catalog" element={
            <ProtectedRoute>
              <AppLayout><CatalogPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/courses/:id" element={
            <ProtectedRoute>
              <AppLayout><CourseDetailPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/doubt-solver" element={
            <ProtectedRoute>
              <AppLayout><DoubtSolverPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-doubts" element={
            <ProtectedRoute>
              <AppLayout><MyDoubtsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/instructor" element={
            <ProtectedRoute role="instructor">
              <AppLayout><InstructorPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
