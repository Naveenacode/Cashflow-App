# Family Invitation & Collaboration Guide

## Overview
The Spend Tracker now supports multi-person collaboration with family accounts. Each family has a unique code that can be shared to invite members.

## How It Works

### 1. Creating a Family (Automatic)
When you **register a new account**, the system automatically:
- Creates a new family with your name (e.g., "John's Family")
- Assigns you as the **Admin** of the family
- Generates a unique 8-character **Family Code** (e.g., `4C1C526E`)

### 2. Inviting Family Members

**As an Admin:**
1. Log in to your account
2. Click on the **"Family"** tab in the navigation
3. You'll see your **Family Code** displayed prominently
4. Click the **"Copy Code"** button to copy it
5. Share this code with family members via:
   - Text message
   - Email
   - In person

**Family Code Format:** 8 uppercase characters (e.g., `4C1C526E`)

### 3. Joining a Family

**For New Members:**
1. **Register** a new account (you'll get your own family initially)
2. Log in to your account
3. Navigate to the **"Family"** tab
4. You'll see a **"Join an Existing Family"** section
5. Enter the 8-character family code shared by the admin
6. Click **"Join Family"**
7. You'll automatically leave your personal family and join the new one as a **Member**

**Important Notes:**
- When you join a family, you leave your previous family
- You become a "Member" (not admin) of the new family
- Your transactions and data move with you

### 4. Family Roles & Permissions

#### Admin Role
✅ Can do everything:
- Create **shared categories** (used by all family members)
- Create **personal categories** (only for themselves)
- Set **budget limits** on shared expense categories
- View **all transactions** from all family members
- Edit/delete **any transaction**
- Remove family members
- See the family code

#### Member Role
✅ Can do:
- Create **personal categories** (only for themselves)
- Add their own **transactions**
- View **family dashboard** (combined data)
- View **personal dashboard** (only their data)
- Edit/delete **their own transactions**
- Use **shared categories**

❌ Cannot do:
- Create shared categories
- Set budget limits
- Delete other members' transactions
- Remove family members
- Promote themselves to admin

### 5. Switching Between Views

The app has a **toggle** in the header:
- **"Family Transactions"**: Shows combined data from all family members
  - Pie charts show total family income/expenses
  - Transaction list shows all family transactions with user icons
  - Budget status reflects family-wide spending

- **"My Transactions"**: Shows only your personal data
  - Pie charts show only your income/expenses
  - Transaction list shows only your transactions
  - Personal view of your contribution

### 6. Category Types

#### Shared Categories (Admin only)
- Created by admin
- Visible to all family members
- Examples: Rent, Groceries, Utilities, Family Entertainment
- Budget limits apply to combined family spending

#### Personal Categories (Any member)
- Created by individual members
- Only visible to the creator
- Examples: Personal Shopping, My Hobbies, Personal Entertainment
- No budget limits on personal categories

### 7. Managing Family Members

**View Members:**
1. Go to the **"Family"** tab
2. See all family members with their:
   - Profile icon
   - Name and email
   - Role (Admin/Member)
   - Join date

**Remove Members (Admin only):**
1. Go to the **"Family"** tab
2. Find the member you want to remove
3. Click the **"Remove"** button next to their name
4. Confirm the action

**Note:** You cannot remove yourself if you're the only admin

### 8. Security & Privacy

- Each family has its **own isolated data**
- Members can only see transactions from their current family
- When you switch families, you **don't bring old family data** with you
- All data is associated with families, not individual users
- Passwords are securely hashed (bcrypt)
- JWT tokens expire after 7 days

## Example Workflow

### Scenario: Mom sets up family tracker

1. **Mom registers:** Creates account → Becomes admin of "Mom's Family" → Gets code `ABC12345`
2. **Mom shares code** with Dad, Son, and Daughter
3. **Dad registers** → Joins using `ABC12345` → Becomes member
4. **Son registers** → Joins using `ABC12345` → Becomes member
5. **Daughter registers** → Joins using `ABC12345` → Becomes member

Now the family can:
- Mom (admin) creates shared categories: Rent, Groceries, Utilities
- Mom sets budget: Groceries = $500/month
- Each member creates personal categories: Dad's Golf, Son's Gaming, Daughter's Shopping
- Everyone adds their expenses
- Mom monitors family spending and budget status
- Everyone can toggle to see "My Transactions" vs "Family Transactions"

## Troubleshooting

### "Invalid family code"
- Double-check the code (must be exactly 8 characters)
- Ask admin to verify the code from their Family tab
- Codes are case-insensitive but should be entered in UPPERCASE

### "You are already in this family"
- You're trying to join your current family
- No action needed - you're already a member!

### "You are the only admin..."
- You can't leave if you're the only admin in a multi-member family
- First promote another member to admin (feature coming soon)
- Or ensure you're not leaving others stranded

### Can't see family code
- Only the admin who created the family can see the code
- If you're a member, ask your family admin for the code

## API Endpoints Reference

For developers:

```bash
# Register
POST /api/auth/register
Body: { name, email, password, profile_icon }

# Login
POST /api/auth/login
Body: { email, password }

# Get family info
GET /api/auth/family
Headers: Authorization: Bearer <token>

# Join family
POST /api/auth/join-family?family_code=ABC12345
Headers: Authorization: Bearer <token>

# Remove member (admin only)
POST /api/auth/remove-member
Headers: Authorization: Bearer <token>
Body: { user_id }
```

## Future Enhancements
- Ability to promote members to admin
- Family settings (rename family, regenerate code)
- Transaction approval workflow (member adds, admin approves)
- Notifications for budget alerts
- Monthly family reports
