import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { adminAPI, kycAPI, dealAPI } from '../api';
import { Users, Briefcase, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingKYC, setReviewingKYC] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, kycRes] = await Promise.all([
        adminAPI.getStats(),
        kycAPI.getPending()
      ]);
      setStats(statsRes.data);
      setPendingKYC(kycRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCReview = async (kycId, status, rejectionReason = null) => {
    setReviewingKYC(kycId);
    try {
      await kycAPI.review(kycId, { status, rejection_reason: rejectionReason });
      alert(`KYC ${status} successfully`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error reviewing KYC:', error);
      alert('Failed to review KYC');
    } finally {
      setReviewingKYC(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="admin-title">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage platform operations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card data-testid="admin-stat-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-deals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_deals || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-investments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.total_investments?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-pending-kyc">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending_kyc || 0}</div>
            </CardContent>
          </Card>

          <Card data-testid="admin-stat-syndicates">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Syndicates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_syndicates || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8" data-testid="admin-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => navigate('/admin/deals/create')} data-testid="admin-create-deal">
                Create Deal
              </Button>
              <Button onClick={() => navigate('/admin/deals')} variant="outline" data-testid="admin-manage-deals">
                Manage Deals
              </Button>
              <Button onClick={() => navigate('/admin/users')} variant="outline" data-testid="admin-manage-users">
                Manage Users
              </Button>
              <Button onClick={() => navigate('/admin/syndicates')} variant="outline" data-testid="admin-manage-syndicates">
                Manage Syndicates
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending KYC Reviews */}
        <Card data-testid="admin-kyc-reviews">
          <CardHeader>
            <CardTitle>Pending KYC Reviews</CardTitle>
            <CardDescription>Review and approve user verifications</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingKYC.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending KYC submissions</p>
            ) : (
              <div className="space-y-4">
                {pendingKYC.map((kyc) => (
                  <div 
                    key={kyc.id} 
                    className="border rounded-lg p-4"
                    data-testid={`kyc-review-${kyc.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">KYC Submission</h3>
                          <Badge variant="outline">User ID: {kyc.user_id.substring(0, 8)}...</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Employment Status</p>
                            <p className="font-medium">{kyc.employment_status}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Source of Funds</p>
                            <p className="font-medium">{kyc.source_of_funds}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Personal Documentation</p>
                            <p className="font-medium">{kyc.personal_documentation}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Age Confirmed</p>
                            <p className="font-medium">{kyc.age_confirmation ? 'Yes' : 'No'}</p>
                          </div>
                          {kyc.identity_document && (
                            <div>
                              <p className="text-gray-600">Identity Document</p>
                              <p className="font-medium">{kyc.identity_document}</p>
                            </div>
                          )}
                          {kyc.address_proof && (
                            <div>
                              <p className="text-gray-600">Address Proof</p>
              <p className="font-medium">{kyc.address_proof}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-500">
                          Submitted on {new Date(kyc.submitted_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm"
                          onClick={() => handleKYCReview(kyc.id, 'approved')}
                          disabled={reviewingKYC === kyc.id}
                          data-testid={`approve-kyc-${kyc.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              handleKYCReview(kyc.id, 'rejected', reason);
                            }
                          }}
                          disabled={reviewingKYC === kyc.id}
                          data-testid={`reject-kyc-${kyc.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
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

export default Admin;
