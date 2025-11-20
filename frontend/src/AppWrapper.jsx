import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Auth from './components/Auth';
import PendingApproval from './components/PendingApproval';
import App from './App';
import { authAPI } from './api';

export default function AppWrapper() {
  const { isAuthenticated, loading, family } = useAuth();
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      checkJoinStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [isAuthenticated]);

  const checkJoinStatus = async () => {
    try {
      const response = await authAPI.getMyJoinStatus();
      setHasPendingRequest(response.data.has_pending);
    } catch (error) {
      console.error('Error checking join status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (hasPendingRequest) {
    return <PendingApproval />;
  }

  return <App />;
}
