import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, Shield, Users, DollarSign, Briefcase, ArrowRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" data-testid="landing-page">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="landing-title">
              LA Investment Platform
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your gateway to smart investments. Join syndicates, invest in deals, and grow your wealth.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={() => navigate('/register')} data-testid="get-started-button">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} data-testid="login-button">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
          <p className="text-lg text-gray-600">Everything you need to make smart investment decisions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card data-testid="feature-deals">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Diverse Deals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access a wide range of investment opportunities across various sectors and risk profiles.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="feature-syndicates">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Join Syndicates</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Collaborate with other investors in primary, public, and private syndicates for larger deals.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="feature-returns">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Track Returns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your investments in real-time with detailed portfolio analytics and performance metrics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="feature-security">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Secure Platform</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete KYC/AML verification ensures a secure and compliant investment environment.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="feature-transparent">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Transparent Fees</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                No hidden charges. Know exactly what you're investing and what returns to expect.
              </CardDescription>
            </CardContent>
          </Card>

          <Card data-testid="feature-support">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Expert Support</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our team of investment experts is here to guide you through your investment journey.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Investing?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of investors already growing their wealth on our platform.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/register')} data-testid="cta-register-button">
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">LA Investment Platform</h3>
            <p className="text-gray-400">Your trusted investment partner</p>
            <p className="text-gray-500 text-sm mt-4">© 2025 LA Investment Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
