import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { dealAPI } from '../api';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';

const Deals = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, [filter]);

  const fetchDeals = async () => {
    try {
      const statusParam = filter === 'all' ? null : filter;
      const response = await dealAPI.getDeals(statusParam);
      setDeals(response.data);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'default',
      closed: 'secondary',
      expired: 'destructive'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading deals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="deals-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="deals-title">Investment Deals</h1>
              <p className="mt-2 text-gray-600">Browse and invest in available opportunities</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]" data-testid="deals-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deals</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {deals.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">No deals found matching your filter</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <Card key={deal.id} className="hover:shadow-lg transition-shadow" data-testid={`deal-card-${deal.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{deal.title}</CardTitle>
                      <CardDescription className="mt-2">{deal.category}</CardDescription>
                    </div>
                    {getStatusBadge(deal.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{deal.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Tenure
                      </span>
                      <span className="font-medium">{deal.tenure_months} months</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Min Investment
                      </span>
                      <span className="font-medium">${deal.min_investment.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Expected Return
                      </span>
                      <span className="font-medium text-green-600">{deal.expected_return}%</span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Raised: ${deal.raised_amount.toLocaleString()}</span>
                        <span>Target: ${deal.target_amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((deal.raised_amount / deal.target_amount) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((deal.raised_amount / deal.target_amount) * 100)}% funded
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    data-testid={`view-deal-${deal.id}`}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Deals;
