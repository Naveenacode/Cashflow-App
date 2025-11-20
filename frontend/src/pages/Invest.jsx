import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { dealAPI, investmentAPI } from '../api';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Invest = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const response = await dealAPI.getDeal(dealId);
      setDeal(response.data);
      setAmount(response.data.min_investment.toString());
    } catch (error) {
      console.error('Error fetching deal:', error);
      setError('Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const investmentAmount = parseFloat(amount);
    
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (investmentAmount < deal.min_investment) {
      setError(`Minimum investment is $${deal.min_investment.toLocaleString()}`);
      return;
    }
    
    if (deal.raised_amount + investmentAmount > deal.target_amount) {
      setError(`Investment would exceed target amount. Maximum available: $${(deal.target_amount - deal.raised_amount).toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    try {
      await investmentAPI.createInvestment({
        deal_id: dealId,
        amount: investmentAmount
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Investment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card data-testid="investment-success-card">
            <CardHeader>
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <CardTitle className="text-2xl">Investment Successful!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  You have successfully invested <span className="font-bold">${parseFloat(amount).toLocaleString()}</span> in <span className="font-bold">{deal.title}</span>.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Your investment is now active. You can track its performance in your portfolio.
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Button onClick={() => navigate('/portfolio')} data-testid="view-portfolio-button">
                    View Portfolio
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/deals')} data-testid="browse-more-deals">
                    Browse More Deals
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="invest-page">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate(`/deals/${dealId}`)} className="mb-6" data-testid="back-to-deal">
          ← Back to Deal
        </Button>

        <Card data-testid="investment-form-card">
          <CardHeader>
            <CardTitle className="text-2xl">Invest in {deal.title}</CardTitle>
            <CardDescription>Complete your investment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Deal Category</span>
                <span className="text-sm font-medium">{deal.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tenure</span>
                <span className="text-sm font-medium">{deal.tenure_months} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expected Return</span>
                <span className="text-sm font-medium text-green-600">{deal.expected_return}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Minimum Investment</span>
                <span className="text-sm font-medium">${deal.min_investment.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center" data-testid="investment-error">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={deal.min_investment}
                  max={deal.target_amount - deal.raised_amount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: $${deal.min_investment}`}
                  required
                  data-testid="investment-amount-input"
                />
                <p className="text-xs text-gray-500">
                  Enter an amount between ${deal.min_investment.toLocaleString()} and ${(deal.target_amount - deal.raised_amount).toLocaleString()}
                </p>
              </div>

              {amount && parseFloat(amount) >= deal.min_investment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Investment Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Investment Amount</span>
                      <span className="font-semibold text-blue-900">${parseFloat(amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Expected Return ({deal.expected_return}%)</span>
                      <span className="font-semibold text-blue-900">
                        ${(parseFloat(amount) * deal.expected_return / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-blue-700 font-medium">Estimated Total</span>
                      <span className="font-bold text-blue-900">
                        ${(parseFloat(amount) + (parseFloat(amount) * deal.expected_return / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a simulated investment platform. No actual payment is processed. 
                  Your investment will be recorded immediately upon confirmation.
                </p>
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  disabled={submitting || !amount || parseFloat(amount) < deal.min_investment}
                  className="flex-1"
                  data-testid="confirm-investment-button"
                >
                  {submitting ? 'Processing...' : 'Confirm Investment'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/deals/${dealId}`)}
                  data-testid="cancel-investment-button"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Invest;
