import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { userAPI } from '../api';
import { User } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.profile?.full_name || user?.full_name || '',
    phone: user?.profile?.phone || '',
    address: user?.profile?.address || '',
    profile_image: user?.profile?.profile_image || '',
    date_of_birth: user?.profile?.date_of_birth || ''
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile(formData);
      alert('Profile updated successfully!');
      setEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="profile-page">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-lg">{user?.full_name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <Badge>{user?.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">KYC Status</span>
                  <Badge>{user?.kyc_status?.toUpperCase()}</Badge>
                </div>
              </div>

              {user?.kyc_status !== 'approved' && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate('/kyc')}
                >
                  Complete KYC
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                {!editing ? (
                  <Button onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!editing}
                    placeholder="Enter your address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_image">Profile Image (filename)</Label>
                  <Input
                    id="profile_image"
                    value={formData.profile_image}
                    onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., avatar.jpg"
                  />
                  <p className="text-xs text-gray-500">Enter the filename for your profile image</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
