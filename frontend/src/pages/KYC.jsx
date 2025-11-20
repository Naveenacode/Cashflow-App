import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { kycAPI } from '../api';
import { CheckCircle, AlertCircle } from 'lucide-react';

const KYC = () => {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    personal_documentation: '',
    age_confirmation: false,
    employment_status: '',
    source_of_funds: '',
    identity_document: '',
    address_proof: ''
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await kycAPI.getStatus();
      setKycStatus(response.data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await kycAPI.submit(formData);
      alert('KYC submitted successfully! We will review it soon.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  // If KYC already submitted and not rejected
  if (kycStatus && kycStatus.status !== 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card data-testid="kyc-status-card">
            <CardHeader>
              <div className="flex items-center space-x-2">
                {kycStatus.status === 'approved' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                )}
                <CardTitle>
                  KYC {kycStatus.status === 'approved' ? 'Approved' : 'Pending Review'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {kycStatus.status === 'approved'
                  ? 'Your KYC verification has been approved. You can now invest in deals.'
                  : 'Your KYC is currently under review. We will notify you once it is processed.'}
              </p>
              <Button onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="kyc-submission-page">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
          <p className="mt-2 text-gray-600">Complete your Know Your Customer verification to start investing</p>
        </div>

        {kycStatus?.status === 'rejected' && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Your previous KYC was rejected</p>
              </div>
              {kycStatus.rejection_reason && (
                <p className="mt-2 text-sm text-red-700">Reason: {kycStatus.rejection_reason}</p>
              )}
              <p className="mt-2 text-sm text-red-700">Please resubmit with correct information.</p>
            </CardContent>
          </Card>
        )}

        <Card data-testid="kyc-form-card">
          <CardHeader>
            <CardTitle>Submit KYC Documents</CardTitle>
            <CardDescription>Please provide the following information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="personal_documentation">Personal Documentation (filename)</Label>
                <Input
                  id="personal_documentation"
                  placeholder="e.g., passport.pdf"
                  value={formData.personal_documentation}
                  onChange={(e) => setFormData({ ...formData, personal_documentation: e.target.value })}
                  required
                  data-testid="kyc-personal-doc-input"
                />
                <p className="text-xs text-gray-500">Enter the filename of your personal documentation</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select 
                  value={formData.employment_status} 
                  onValueChange={(value) => setFormData({ ...formData, employment_status: value })}
                >
                  <SelectTrigger data-testid="kyc-employment-select">
                    <SelectValue placeholder="Select employment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="business-owner">Business Owner</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_of_funds">Source of Funds</Label>
                <Input
                  id="source_of_funds"
                  placeholder="e.g., Salary, Business Income, Savings"
                  value={formData.source_of_funds}
                  onChange={(e) => setFormData({ ...formData, source_of_funds: e.target.value })}
                  required
                  data-testid="kyc-source-funds-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="identity_document">Identity Document (filename)</Label>
                <Input
                  id="identity_document"
                  placeholder="e.g., drivers_license.pdf"
                  value={formData.identity_document}
                  onChange={(e) => setFormData({ ...formData, identity_document: e.target.value })}
                  data-testid="kyc-identity-doc-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_proof">Address Proof (filename)</Label>
                <Input
                  id="address_proof"
                  placeholder="e.g., utility_bill.pdf"
                  value={formData.address_proof}
                  onChange={(e) => setFormData({ ...formData, address_proof: e.target.value })}
                  data-testid="kyc-address-proof-input"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="age_confirmation"
                  checked={formData.age_confirmation}
                  onChange={(e) => setFormData({ ...formData, age_confirmation: e.target.checked })}
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  data-testid="kyc-age-checkbox"
                />
                <Label htmlFor="age_confirmation" className="text-sm">
                  I confirm that I am 18 years or older
                </Label>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={submitting} className="flex-1" data-testid="kyc-submit-button">
                  {submitting ? 'Submitting...' : 'Submit KYC'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} data-testid="kyc-cancel-button">
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

export default KYC;
