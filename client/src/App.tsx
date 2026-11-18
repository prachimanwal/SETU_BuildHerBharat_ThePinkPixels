import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SeekerDashboardPage } from './pages/SeekerDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AssessPage } from './pages/AssessPage';
import { LearnPage } from './pages/LearnPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { MyProgressPage } from './pages/MyProgressPage';
import { GovernmentSchemesPage } from './pages/GovernmentSchemesPage';
import { BuildHerPage } from './pages/BuildHerPage';
import { EmployerDashboardPage } from './pages/EmployerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

// Protected Route Component for Authenticated Users
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'employer') return <Navigate to="/employer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Discovery Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/schemes" element={<GovernmentSchemesPage />} />
                <Route path="/build-her" element={<BuildHerPage />} />
                <Route path="/learn" element={<LearnPage />} />

                {/* Seeker Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['seeker']}>
                      <SeekerDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['seeker']}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assess"
                  element={
                    <ProtectedRoute allowedRoles={['seeker']}>
                      <AssessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <ProtectedRoute allowedRoles={['seeker']}>
                      <PortfolioPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/applications"
                  element={
                    <ProtectedRoute allowedRoles={['seeker']}>
                      <ApplicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/progress"
                  element={
                    <ProtectedRoute allowedRoles={['seeker']}>
                      <MyProgressPage />
                    </ProtectedRoute>
                  }
                />

                {/* Employer Portal */}
                <Route
                  path="/employer"
                  element={
                    <ProtectedRoute allowedRoles={['employer']}>
                      <EmployerDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Control Portal */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
