import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../AuthContext';
import { User, Users, Mail, Lock, AlertCircle } from 'lucide-react';

const PROFILE_ICONS = [
  { id: 'user-circle', emoji: '👤', label: 'Default' },
  { id: 'user-male', emoji: '👨', label: 'Male' },
  { id: 'user-female', emoji: '👩', label: 'Female' },
  { id: 'user-child', emoji: '🧒', label: 'Child' },
  { id: 'user-elderly', emoji: '👴', label: 'Elderly' },
  { id: 'user-teen', emoji: '🧑', label: 'Teen' },
  { id: 'user-baby', emoji: '👶', label: 'Baby' },
  { id: 'user-couple', emoji: '👫', label: 'Couple' },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile_icon: 'user-circle',
    registrationType: 'create', // 'create' or 'join'
    familyCode: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        // Validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        if (formData.registrationType === 'join' && !formData.familyCode) {
          setError('Please enter a family code to join');
          setLoading(false);
          return;
        }
        if (formData.registrationType === 'join' && formData.familyCode.length !== 8) {
          setError('Family code must be 8 characters');
          setLoading(false);
          return;
        }
        
        // Register with family code if joining
        await register(
          formData.name, 
          formData.email, 
          formData.password, 
          formData.profile_icon,
          formData.registrationType === 'join' ? formData.familyCode : null
        );
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Create Your Family Account'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to manage your family finances' 
              : 'Start tracking expenses with your family'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Choose Your Profile Icon</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROFILE_ICONS.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, profile_icon: icon.id })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.profile_icon === icon.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl">{icon.emoji}</div>
                        <div className="text-xs text-gray-600 mt-1">{icon.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info about family creation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Note:</strong> Creating an account will automatically create a new family 
                    with you as the admin. You'll receive a family code to invite other members.
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
