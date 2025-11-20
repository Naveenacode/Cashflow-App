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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl bg-gray-800 border-gray-700">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Your Family Account'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {isLogin 
              ? 'Sign in to manage your family finances' 
              : 'Start tracking expenses with your family'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Registration Type Selector */}
                <div className="space-y-3">
                  <Label>I want to...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, registrationType: 'create', familyCode: '' })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.registrationType === 'create'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="h-5 w-5 text-blue-600 mb-2" />
                      <div className="font-semibold text-sm">Create New Family</div>
                      <div className="text-xs text-gray-500 mt-1">I'll be the admin</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, registrationType: 'join' })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.registrationType === 'join'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="h-5 w-5 text-blue-600 mb-2" />
                      <div className="font-semibold text-sm">Join Existing Family</div>
                      <div className="text-xs text-gray-500 mt-1">I have a code</div>
                    </button>
                  </div>
                </div>

                {/* Family Code Input (only for join) */}
                {formData.registrationType === 'join' && (
                  <div className="space-y-2">
                    <Label htmlFor="familyCode">Family Code</Label>
                    <Input
                      id="familyCode"
                      placeholder="Enter 8-character code"
                      value={formData.familyCode}
                      onChange={(e) => setFormData({ ...formData, familyCode: e.target.value.toUpperCase() })}
                      maxLength={8}
                      className="text-center text-lg tracking-wider font-mono"
                      required
                    />
                    <p className="text-xs text-gray-500">Ask your family admin for the code</p>
                  </div>
                )}

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

                {/* Info about family creation/joining */}
                {formData.registrationType === 'create' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900">
                      <strong>Creating a new family:</strong> You'll be the admin and receive a unique 
                      family code to share with family members.
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-900">
                      <strong>Joining a family:</strong> You'll become a member and can start tracking 
                      expenses with your family right away.
                    </p>
                  </div>
                )}
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
