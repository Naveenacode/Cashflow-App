# LA Investment Platform - Login Instructions

## How to Access the Platform

### Frontend URL
The platform is accessible at your preview URL (check the Emergent interface for the exact URL)

### Test Accounts

#### Admin Account
- **Email:** admin@test.com
- **Password:** admin123
- **Access:** Full admin privileges including:
  - KYC approval/rejection
  - View all platform statistics
  - Create and manage deals
  - View all users and investments
  - Manage syndicates

#### Investor Account
- **Email:** investor@test.com
- **Password:** investor123
- **Access:** Standard investor features:
  - Submit KYC
  - Browse and invest in deals
  - View personal portfolio
  - Join syndicates
  - Submit feedback

## Step-by-Step Login Process

### For Admin Login:

1. Open the frontend URL in your browser
2. You'll see the Landing Page
3. Click "Sign In" button in the top right
4. Enter credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
5. Click "Sign In"
6. You'll be redirected to the Dashboard
7. Notice the "Admin" link in the navigation bar (only visible to admin users)
8. Click "Admin" to access the admin dashboard

### For Investor Login:

1. Open the frontend URL in your browser
2. Click "Sign In" button
3. Enter credentials:
   - Email: `investor@test.com`
   - Password: `investor123`
4. Click "Sign In"
5. You'll be redirected to the Dashboard
6. Navigate through:
   - Dashboard - Overview
   - Deals - Browse investment opportunities
   - Portfolio - View your investments
   - Syndicates - Join investment groups
   - Profile - Manage your account

## Available Features by Role

### Admin Features:
✅ Admin Dashboard with platform statistics
✅ KYC Review and Approval
✅ View all users
✅ View all investments
✅ Create deals (navigate to Deals page)
✅ Manage syndicates
✅ All investor features

### Investor Features:
✅ Submit KYC for verification
✅ Browse all investment deals
✅ View deal details
✅ Make investments (requires KYC approval)
✅ View personal portfolio
✅ Track investment returns
✅ Request withdrawals
✅ Join and view syndicates
✅ Submit feedback
✅ Manage profile

## Sample Deals Available

Two sample deals have been created:

1. **Tech Startup Series A**
   - Category: Technology
   - Min Investment: $10,000
   - Target: $500,000
   - Expected Return: 25%
   - Tenure: 24 months

2. **Real Estate Development**
   - Category: Real Estate
   - Min Investment: $25,000
   - Target: $1,000,000
   - Expected Return: 18%
   - Tenure: 36 months

## Testing the Complete Flow

### As Admin:
1. Login as admin
2. Go to Admin dashboard
3. See platform statistics
4. Check for pending KYC submissions
5. Approve/reject KYC submissions
6. Navigate to Deals to view all deals

### As Investor:
1. Login as investor
2. Go to Dashboard - see KYC warning
3. Click "Submit KYC" or go to KYC page
4. Fill in the KYC form with sample data:
   - Personal documentation: "passport.pdf"
   - Employment: Select any option
   - Source of funds: "Salary"
   - Identity document: "drivers_license.pdf"
   - Address proof: "utility_bill.pdf"
   - Check age confirmation
5. Submit KYC
6. Logout and login as admin
7. Go to Admin dashboard
8. Approve the KYC submission
9. Logout and login as investor again
10. Go to Deals page
11. Click on a deal to view details
12. Click "Invest Now"
13. Enter investment amount (must be >= minimum)
14. Confirm investment
15. Go to Portfolio to see your investment

## Troubleshooting

### Can't login?
- Make sure you're using the correct email and password
- Check that both backend and frontend services are running
- Clear browser cache and cookies
- Try in an incognito window

### "KYC approval required" message?
- This is expected for new investor accounts
- Submit KYC as investor
- Login as admin to approve it
- Login back as investor to invest

### Admin menu not showing?
- Make sure you're logged in as admin@test.com
- The "Admin" link only appears for admin role users
- Try logging out and logging back in

## API Endpoints (for testing)

Backend API is available at: `http://localhost:8001/api`

Key endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- GET /api/deals - Get all deals
- GET /api/kyc/status - Check KYC status
- POST /api/investments - Create investment

## Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Check frontend logs: `tail -f /var/log/supervisor/frontend.err.log`
4. Verify services are running: `sudo supervisorctl status`

---

**Platform Status:** ✅ Fully operational and ready to use!
