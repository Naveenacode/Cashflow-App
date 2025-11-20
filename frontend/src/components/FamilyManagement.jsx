import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../AuthContext';
import { authAPI } from '../api';
import { Users, Copy, CheckCircle, Trash2, UserPlus, Clock, X } from 'lucide-react';

const PROFILE_ICONS = {
  'user-circle': '👤',
  'user-male': '👨',
  'user-female': '👩',
  'user-child': '🧒',
  'user-elderly': '👴',
  'user-teen': '🧑',
  'user-baby': '👶',
  'user-couple': '👫'
};

export default function FamilyManagement() {
  const { family, isAdmin } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const copyFamilyCode = () => {
    navigator.clipboard.writeText(family.family_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the family?')) {
      return;
    }

    try {
      // Call API to remove member
      // await authAPI.removeMember(userId);
      // Refresh family data
      alert('Member removal functionality will be implemented in the next phase');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Management</h2>
      </div>

      {/* Family Info Card */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{family?.family_name}</span>
          </CardTitle>
          <CardDescription>
            {family?.members?.length || 0} member{family?.members?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Family Code Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Family Invite Code</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-2xl font-bold text-blue-600 tracking-wider">
                      {family?.family_code}
                    </code>
                    {copied && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this code with family members to invite them
                  </p>
                </div>
                <Button 
                  onClick={copyFamilyCode}
                  variant="outline"
                  className="ml-4"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>

            {/* How to Invite Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <UserPlus className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 mb-1">How to invite family members:</p>
                  <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                    <li>Share the family code above with your family member</li>
                    <li>They should create a new account or log in</li>
                    <li>Click on "Family" tab and enter the code to join</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members Card */}
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Manage your family members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {family?.members?.map((member) => (
              <div 
                key={member.user_id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  {/* Profile Icon */}
                  <div className="text-4xl">
                    {PROFILE_ICONS[member.profile_icon] || '👤'}
                  </div>
                  
                  {/* Member Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{member.name}</span>
                      {member.role === 'admin' && (
                        <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
                      )}
                      {member.user_id === family?.admin_user_id && (
                        <Badge className="bg-purple-100 text-purple-800">Owner</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && member.user_id !== family?.admin_user_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member.user_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Create shared categories</li>
                <li>Set budget limits</li>
                <li>View all transactions</li>
                <li>Edit/delete any transaction</li>
                <li>Manage family members</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Badge className="bg-gray-200 text-gray-800">Member</Badge>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Create personal categories</li>
                <li>Add transactions</li>
                <li>View family dashboard</li>
                <li>Edit/delete own transactions</li>
                <li>View shared categories</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
