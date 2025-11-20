import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { dealAPI, kycAPI } from '../api';
import { Calendar, TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deal, setDeal] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [dealRes, kycRes] = await Promise.all([
        dealAPI.getDeal(id),
        kycAPI.getStatus()
      ]);
      setDeal(dealRes.data);
      setKycStatus(kycRes.data);
    } catch (error) {
      console.error('Error fetching deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const canInvest = () => {
    if (!deal) return false;
    if (deal.status !== 'open') return false;
    if (!kycStatus || kycStatus.status !== 'approved') return false;
    return true;
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'default',
      closed: 'secondary',
      expired: 'destructive'
    };
    return <Badge variant={variants[status]} data-testid="deal-status-badge">{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">Loading deal details...</div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">Deal not found</p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate('/deals')}>Back to Deals</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="deal-detail-page">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="outline" onClick={() => navigate('/deals')} className="mb-6" data-testid="back-to-deals">
          ← Back to Deals
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card data-testid="deal-info-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl" data-testid="deal-title">{deal.title}</CardTitle>
                    <CardDescription className="mt-2 text-lg">{deal.category}</CardDescription>
                  </div>
                  {getStatusBadge(deal.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed" data-testid="deal-description">{deal.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Tenure Period</p>
                    <p className="text-lg font-semibold">{deal.tenure_months} months</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Expected Return</p>
                    <p className="text-lg font-semibold text-green-600">{deal.expected_return}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Minimum Investment</p>
                    <p className="text-lg font-semibold">${deal.min_investment.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Investors</p>
                    <p className="text-lg font-semibold">{deal.investor_count}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Funding Progress</span>
                    <span className="font-medium">
                      ${deal.raised_amount.toLocaleString()} / ${deal.target_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((deal.raised_amount / deal.target_amount) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {Math.round((deal.raised_amount / deal.target_amount) * 100)}% of target achieved
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Expires on</p>
                  <p className="text-base font-medium">
                    {new Date(deal.expires_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card data-testid="investment-card">
              <CardHeader>
                <CardTitle>Invest Now</CardTitle>
                <CardDescription>Start your investment journey</CardDescription>
              </CardHeader>
              <CardContent>
                {deal.status === 'expired' ? (
                  <div className="text-center py-6">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">This deal has expired</p>
                  </div>
                ) : deal.status === 'closed' ? (
                  <div className="text-center py-6">
                    <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">This deal is fully funded</p>
                  </div>
                ) : !kycStatus || kycStatus.status !== 'approved' ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-4">
                        {!kycStatus 
                          ? 'KYC verification required to invest'
                          : kycStatus.status === 'pending'
                          ? 'Your KYC is under review'
                          : 'Your KYC was rejected. Please resubmit.'}
                      </p>
                      {!kycStatus && (
                        <Button onClick={() => navigate('/kyc')} data-testid="kyc-required-button">
                          Complete KYC
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Minimum investment: <span className="font-bold">${deal.min_investment.toLocaleString()}</span>
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/invest/${deal.id}`)}
                      disabled={!canInvest()}
                      data-testid="invest-now-button"
                    >
                      Invest Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Total Investors
                  </span>
                  <span className="font-semibold">{deal.investor_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Total Raised
                  </span>
                  <span className="font-semibold">${deal.raised_amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Expected ROI
                  </span>
                  <span className="font-semibold text-green-600">{deal.expected_return}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;
