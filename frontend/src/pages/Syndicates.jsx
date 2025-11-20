import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { syndicateAPI } from '../api';
import { Users, DollarSign } from 'lucide-react';

const Syndicates = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [syndicates, setSyndicates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyndicates();
  }, [filter]);

  const fetchSyndicates = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        if (['primary', 'public', 'private'].includes(filter)) {
          params.syndicate_type = filter;
        } else {
          params.status = filter;
        }
      }
      const response = await syndicateAPI.getSyndicates(params);
      setSyndicates(response.data);
    } catch (error) {
      console.error('Error fetching syndicates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      blocked: 'destructive',
      closed: 'secondary'
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      primary: 'bg-blue-100 text-blue-800',
      public: 'bg-green-100 text-green-800',
      private: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[type]}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading syndicates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="syndicates-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="syndicates-title">Syndicates</h1>
              <p className="mt-2 text-gray-600">Join investment syndicates</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]" data-testid="syndicates-filter">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Syndicates</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button onClick={() => navigate('/syndicates/create')} data-testid="create-syndicate-button">
                  Create Syndicate
                </Button>
              )}
            </div>
          </div>
        </div>

        {syndicates.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">No syndicates found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syndicates.map((syndicate) => (
              <Card key={syndicate.id} className="hover:shadow-lg transition-shadow" data-testid={`syndicate-card-${syndicate.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{syndicate.name}</CardTitle>
                      <CardDescription className="mt-2">{syndicate.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    {getTypeBadge(syndicate.syndicate_type)}
                    {getStatusBadge(syndicate.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        Members
                      </span>
                      <span className="font-medium">{syndicate.member_count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Total Investment
                      </span>
                      <span className="font-medium">${syndicate.total_investment.toLocaleString()}</span>
                    </div>
                    
                    {syndicate.start_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Start Date</span>
                        <span className="font-medium">
                          {new Date(syndicate.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    onClick={() => navigate(`/syndicates/${syndicate.id}`)}
                    disabled={syndicate.status === 'blocked'}
                    data-testid={`view-syndicate-${syndicate.id}`}
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

export default Syndicates;
