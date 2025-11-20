import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuth } from '../AuthContext';
import { authAPI } from '../api';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { logout } = useAuth();
  const [joinStatus, setJoinStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await authAPI.getMyJoinStatus();
      setJoinStatus(response.data);
      
      // If no longer pending, reload the app
      if (!response.data.has_pending) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-amber-600 bg-gray-800">
        <CardHeader className="text-center bg-gray-700">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-600 p-3 rounded-full animate-pulse">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Waiting for Approval</CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold text-gray-200">
              Your request to join
            </p>
            <p className="text-2xl font-bold text-amber-400">
              {joinStatus?.family_name || 'the family'}
            </p>
            <p className="text-sm text-gray-400">
              is pending admin approval.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>What happens next?</strong>
              <br />
              The family admin will review your request and approve or reject it. 
              You'll be able to access the family dashboard once approved.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={checkStatus}
              disabled={checking}
              className="w-full"
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Status'}
            </Button>

            <Button 
              onClick={logout}
              className="w-full"
              variant="outline"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Joined the wrong family? Logout and create a new account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
