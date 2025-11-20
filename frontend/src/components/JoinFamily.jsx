import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { authAPI } from '../api';
import { AlertCircle, Users, CheckCircle } from 'lucide-react';

export default function JoinFamily({ onSuccess }) {
  const [familyCode, setFamilyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.joinFamily(familyCode.toUpperCase().trim());
      setSuccess(true);
      
      // Store new token
      localStorage.setItem('token', response.data.access_token);
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          // Reload page to refresh auth context
          window.location.reload();
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid family code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-green-900">Successfully Joined Family!</h3>
            <p className="text-sm text-green-700">Redirecting you to the dashboard...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle>Join an Existing Family</CardTitle>
        </div>
        <CardDescription>
          Enter the family code provided by your family admin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoinFamily} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="familyCode">Family Code</Label>
            <Input
              id="familyCode"
              placeholder="Enter 8-character code"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-lg tracking-wider font-mono"
              required
            />
            <p className="text-xs text-gray-500">
              Ask your family admin for the family code
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || familyCode.length !== 8}
          >
            {loading ? 'Joining...' : 'Join Family'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Once you join a family, you'll leave your current family (if any) 
            and become a member of the new family. You'll be able to view and add transactions 
            within your new family.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
