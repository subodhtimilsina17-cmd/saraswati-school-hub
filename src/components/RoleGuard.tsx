import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleGuardProps {
  role: 'super_admin' | 'teacher';
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ role, children }) => {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile || profile.role !== role) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default RoleGuard;
