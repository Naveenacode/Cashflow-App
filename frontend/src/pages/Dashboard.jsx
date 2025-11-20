import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { kycAPI, dealAPI, investmentAPI } from '../api';
import { TrendingUp, Briefcase, DollarSign, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState(null);
  const [deals, setDeals] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [kycRes, dealsRes, portfolioRes] = await Promise.all([
        kycAPI.getStatus(),
        dealAPI.getDeals('open'),
        investmentAPI.getPortfolio()
      ]);
      
      setKycStatus(kycRes.data);
      setDeals(dealsRes.data.slice(0, 3)); // Show top 3 deals
      setPortfolio(portfolioRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKycBadge = () => {
    if (!kycStatus) {
      return <Badge variant="outline" data-testid="kyc-badge">Not Submitted</Badge>;
    }
    
    const variants = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive'
    };
    
    return <Badge variant={variants[kycStatus.status]} data-testid="kyc-badge">{kycStatus.status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Welcome back, {user?.full_name}!</h1>
          <p className="mt-2 text-gray-600">Here's your investment overview</p>
        </div>

        {/* KYC Warning */}
        {(!kycStatus || kycStatus.status !== 'approved') && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50" data-testid="kyc-warning">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg">KYC Verification Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                {!kycStatus 
                  ? 'Please complete your KYC verification to start investing.'
                  : kycStatus.status === 'pending'
                  ? 'Your KYC is under review. We\'ll notify you once approved.'
                  : 'Your KYC was rejected. Please resubmit with correct information.'}
              </p>
              {!kycStatus && (
                <Button onClick={() => navigate('/kyc')} data-testid="kyc-submit-button">Submit KYC</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="stat-total-invested">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.total_invested?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Across {portfolio?.total_count || 0} investments</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-profit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.total_profit?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">From active investments</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-deals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio?.active_count || 0}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deals */}
        <Card data-testid="recent-deals-section">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Open Deals</CardTitle>
                <CardDescription>Latest investment opportunities</CardDescription>
              </div>
              <Button variant="outline" onClick={() => navigate('/deals')} data-testid="view-all-deals-button">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No open deals available</p>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`deal-card-${deal.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{deal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{deal.description}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>Category: {deal.category}</span>
                          <span>Tenure: {deal.tenure_months} months</span>
                          <span>Min: ${deal.min_investment.toLocaleString()}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((deal.raised_amount / deal.target_amount) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min((deal.raised_amount / deal.target_amount) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => navigate(`/deals/${deal.id}`)} className="ml-4" data-testid={`view-deal-${deal.id}`}>View</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card className="mt-6" data-testid="kyc-status-card">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">KYC Status</p>
                <p className="text-sm text-gray-500">Know Your Customer verification</p>
              </div>
              {getKycBadge()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
