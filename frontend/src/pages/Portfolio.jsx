import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { investmentAPI, withdrawalAPI } from '../api';
import { TrendingUp, DollarSign, Calendar, ArrowUpRight } from 'lucide-react';

const Portfolio = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const [portfolioRes, withdrawalsRes] = await Promise.all([
        investmentAPI.getPortfolio(),
        withdrawalAPI.getUserWithdrawals()
      ]);
      setPortfolio(portfolioRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      completed: 'secondary',
      withdrawn: 'outline'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getWithdrawalBadge = (status) => {
    const variants = {
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
      completed: 'secondary'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading portfolio...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="portfolio-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="portfolio-title">My Portfolio</h1>
          <p className="mt-2 text-gray-600">Track your investments and returns</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="stat-total-invested">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio?.total_invested?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-profit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${portfolio?.total_profit?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-investments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio?.active_count || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-investments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio?.total_count || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Investments List */}
        <Card className="mb-8" data-testid="investments-list">
          <CardHeader>
            <CardTitle>My Investments</CardTitle>
            <CardDescription>All your investment activities</CardDescription>
          </CardHeader>
          <CardContent>
            {!portfolio?.investments || portfolio.investments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No investments yet</p>
                <Button onClick={() => navigate('/deals')} data-testid="start-investing-button">
                  Start Investing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolio.investments.map((investment) => (
                  <div 
                    key={investment.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`investment-${investment.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{investment.deal_title || 'Investment'}</h3>
                          {getStatusBadge(investment.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{investment.deal_category}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Amount Invested</p>
                            <p className="text-base font-semibold">${investment.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expected Return</p>
                            <p className="text-base font-semibold text-green-600">{investment.expected_return}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Current Profit</p>
                            <p className="text-base font-semibold text-green-600">${investment.profit.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Invested On</p>
                            <p className="text-base font-semibold">
                              {new Date(investment.invested_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/deals/${investment.deal_id}`)}
                        data-testid={`view-deal-${investment.id}`}
                      >
                        View Deal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal Section */}
        <Card data-testid="withdrawals-section">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>Manage your fund withdrawals</CardDescription>
              </div>
              <Button onClick={() => navigate('/withdrawals/create')} data-testid="request-withdrawal-button">
                Request Withdrawal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No withdrawal requests</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div 
                    key={withdrawal.id}
                    className="flex items-center justify-between border rounded-lg p-4"
                    data-testid={`withdrawal-${withdrawal.id}`}
                  >
                    <div>
                      <p className="font-semibold">${withdrawal.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        Requested on {new Date(withdrawal.requested_at).toLocaleDateString()}
                      </p>
                      {withdrawal.reason && (
                        <p className="text-xs text-gray-500 mt-1">{withdrawal.reason}</p>
                      )}
                    </div>
                    {getWithdrawalBadge(withdrawal.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portfolio;
