import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DashboardLayout } from './components/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SeekerDashboardPage } from './pages/SeekerDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileOnboardingPage } from './pages/ProfileOnboardingPage';
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

// Helper for Protected Authenticated Routes with 20:80 SaaS Layout
const ProtectedDashboardRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFF]">
        <div className="animate-spin w-8 h-8 border-4 border-[#A2D2FF] border-t-transparent rounded-full" />
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

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Helper for Dual-Access Pages (Public when logged out; 20:80 SaaS Dashboard when logged in)
const HybridRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFF]">
        <div className="animate-spin w-8 h-8 border-4 border-[#A2D2FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCFF] text-[#334155]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

// Helper for Login/Register Pages
const AuthOnlyRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFF]">
        <div className="animate-spin w-8 h-8 border-4 border-[#A2D2FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'employer') return <Navigate to="/employer" replace />;
    const needsOnboarding =
      !user.seekerProfile?.onboardingCompleted &&
      !user.seekerProfile?.onboardingSkipped &&
      (user.profileCompletion ?? 0) < 40;
    return <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCFF] text-[#334155]">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

// Helper for Landing Page
const HomeRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FCFF]">
        <div className="animate-spin w-8 h-8 border-4 border-[#A2D2FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'employer') return <Navigate to="/employer" replace />;
    const needsOnboarding =
      !user.seekerProfile?.onboardingCompleted &&
      !user.seekerProfile?.onboardingSkipped &&
      (user.profileCompletion ?? 0) < 40;
    return <Navigate to={needsOnboarding ? '/onboarding' : '/dashboard'} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FCFF] text-[#334155]">
      <Navbar />
      <main className="flex-1">
        <HomePage />
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Landing & Public Discovery Routes */}
            <Route path="/" element={<HomeRoute />} />
            <Route
              path="/login"
              element={
                <AuthOnlyRoute>
                  <LoginPage />
                </AuthOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <AuthOnlyRoute>
                  <RegisterPage />
                </AuthOnlyRoute>
              }
            />

            {/* Dual Access Routes (Public when logged out; 20:80 Dashboard when logged in) */}
            <Route
              path="/opportunities"
              element={
                <HybridRoute>
                  <OpportunitiesPage />
                </HybridRoute>
              }
            />
            <Route
              path="/schemes"
              element={
                <HybridRoute>
                  <GovernmentSchemesPage />
                </HybridRoute>
              }
            />
            <Route
              path="/build-her"
              element={
                <HybridRoute>
                  <BuildHerPage />
                </HybridRoute>
              }
            />
            <Route
              path="/learn"
              element={
                <HybridRoute>
                  <LearnPage />
                </HybridRoute>
              }
            />

            {/* Seeker Authenticated 20:80 Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <SeekerDashboardPage />
                </ProtectedDashboardRoute>
              }
            />
            <Route
              path="/home"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/profile"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <ProfilePage />
                </ProtectedDashboardRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <ProfileOnboardingPage />
                </ProtectedDashboardRoute>
              }
            />
            <Route
              path="/assess"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <AssessPage />
                </ProtectedDashboardRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <PortfolioPage />
                </ProtectedDashboardRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <ApplicationsPage />
                </ProtectedDashboardRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedDashboardRoute allowedRoles={['seeker']}>
                  <MyProgressPage />
                </ProtectedDashboardRoute>
              }
            />

            {/* Employer 20:80 Dashboard Portal */}
            <Route
              path="/employer"
              element={
                <ProtectedDashboardRoute allowedRoles={['employer']}>
                  <EmployerDashboardPage />
                </ProtectedDashboardRoute>
              }
            />

            {/* Admin 20:80 Dashboard Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedDashboardRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedDashboardRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
