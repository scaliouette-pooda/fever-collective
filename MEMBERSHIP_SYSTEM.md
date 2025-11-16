# Membership System Documentation

## Overview
Complete membership tier system for The Fever Studio with manual payment tracking and future Stripe integration support.

## Files Created

### Backend
1. **`server/models/Membership.js`** - Database models
   - `MembershipTier` - Stores tier definitions
   - `UserMembership` - Tracks user memberships

2. **`server/routes/memberships.js`** - API endpoints
   - Public routes for viewing tiers
   - User routes for managing own membership
   - Admin routes for membership management

3. **`server/scripts/seedMembershipTiers.js`** - Seed script
   - Populates all 9 tier combinations (3 tiers × 3 pricing phases)

4. **`server/models/Settings.js`** - Updated with payment gateway settings

5. **`server/server.js`** - Added membership routes

---

## Setup Instructions

### 1. Seed Membership Tiers
Run this once to populate your membership tiers:

```bash
cd server
node scripts/seedMembershipTiers.js
```

This creates:
- **Founders Tier 1** (Dec 1): $60/$80/$100 (Max 100 members each)
- **Founders Tier 2** (Jan 1): $80/$120/$140 (Max 100 members each)
- **General** (Feb 1): $100/$160/$200 (Unlimited)

### 2. Configure Payment Settings

Access Admin Dashboard → Settings → Payment Settings:

- **Payment Gateway**: Manual (change to Stripe later)
- **Membership Payment Mode**: Manual
- **Drop-in Rate**: $30
- **Same Day Discount**: 15%
- **Upgrade Discount**: 15%
- **Require Waiver**: Yes/No

---

## API Endpoints

### Public Endpoints

**GET /api/memberships/tiers**
- Returns all available membership tiers grouped by pricing phase
- No authentication required

### User Endpoints (Requires Login)

**GET /api/memberships/my-membership**
- Get current user's membership details
- Returns credits, status, billing info

**POST /api/memberships/deduct-credits**
```json
{
  "amount": 1,
  "isSpecialtyClass": false
}
```

**POST /api/memberships/record-attendance**
- Records class attendance
- Checks for milestone rewards
- Returns: `{ totalClasses, reward }`

### Admin Endpoints (Requires Admin Role)

**POST /api/memberships/admin/assign**
Assign membership to user:
```json
{
  "userId": "user_id",
  "membershipTier": "fever-starter",
  "pricingTier": "founders-1",
  "monthlyPrice": 60,
  "paymentMethod": "manual",
  "creditsTotal": 4,
  "notes": "Paid via Venmo"
}
```

**PATCH /api/memberships/admin/:membershipId**
Update membership details

**POST /api/memberships/admin/:membershipId/cancel**
Cancel membership:
```json
{
  "immediate": false  // true for immediate, false for 30-day notice
}
```

**POST /api/memberships/admin/:membershipId/add-credits**
Add bonus credits:
```json
{
  "credits": 2,
  "reason": "Makeup class from cancellation"
}
```

**GET /api/memberships/admin/all**
List all memberships with filters:
- `?status=active`
- `?tier=epidemic`
- `?page=1&limit=50`

**GET /api/memberships/admin/stats**
Get membership statistics:
- Total active/cancelled memberships
- By tier breakdown
- Monthly Recurring Revenue (MRR)

---

## Membership Features

### 1. Credit System
- **Fever Starter**: 4 credits/month
- **Outbreak**: 8 credits/month
- **Epidemic**: Unlimited (no credit tracking)
- **Specialty Classes**: Cost 2 credits
- **Expiration**: 2 months for class-based tiers

### 2. Booking Priority
- **Fever Starter & Outbreak**: 48 hours advance booking
- **Epidemic**: 72 hours priority advance booking

### 3. Milestone Rewards
Automatic rewards trigger at:
- **50 classes**: Sweat towel
- **100 classes**: Tote bag
- **150 classes**: Water Bottle
- **200 classes**: Hat
- **250 classes**: Hoodie

### 4. Discounts
- **Same-day signup**: 15% off first month
- **Upgrade from class tier**: 15% off 1 month
- **Referral**: $50 off 1 month (existing referral system)

### 5. Cancellation Policy
- **30-day notice** required
- Status changes to `pending-cancellation`
- Membership remains active for 30 days
- Credits can still be used during notice period

---

## Admin Workflow (Manual Mode)

### Signing Up a New Member

1. **User signs up** on website or in person
2. **Admin assigns membership**:
   ```
   Admin Dashboard → Memberships → Assign New Membership
   ```
3. **Fill in details**:
   - Select user
   - Choose tier and pricing level
   - Enter payment method (manual/cash/venmo)
   - Add any first-month discount
   - Add notes (e.g., "Paid via Venmo @username")
4. **Credits auto-assigned** based on tier

### Monthly Billing (Manual Mode)

1. **Collect payment** from member (Venmo/Cash/etc)
2. **Update membership**:
   ```
   Admin Dashboard → Memberships → Find Member → Add Payment Note
   ```
3. **Credits auto-reset** on next billing date
4. **System tracks** billing dates automatically

### Handling Class Bookings

1. **User books class** through system
2. **System checks**:
   - Has active membership?
   - Sufficient credits?
   - Within advance booking window?
3. **Auto-deducts** credits (1 for regular, 2 for specialty)
4. **Tracks attendance** for milestone rewards

### Processing Cancellations

1. **Member requests cancellation**
2. **Admin marks as cancelled**:
   - Immediate: Cancels right away
   - 30-day notice: Sets cancellation date
3. **Member can use credits** during notice period
4. **Auto-expires** after notice period

---

## Future Stripe Integration

When ready to enable Stripe:

### 1. Setup Stripe Account
1. Create Stripe account at stripe.com
2. Get API keys from Dashboard

### 2. Update Settings
Admin Dashboard → Settings → Payment:
```
Payment Gateway: Stripe
Stripe Publishable Key: pk_live_...
Stripe Secret Key: sk_live_...
Membership Payment Mode: Automated
```

### 3. Code Updates Needed
Will need to add:
- Stripe SDK integration
- Webhook handlers for subscription events
- Customer portal for self-service
- Automated billing on renewal dates

---

## Database Schema

### MembershipTier
```javascript
{
  name: 'fever-starter' | 'outbreak' | 'epidemic',
  displayName: 'The Fever Starter',
  pricingTier: 'founders-1' | 'founders-2' | 'general',
  price: 60,
  pricePerClass: 15,
  classesPerMonth: 4,  // null for unlimited
  isUnlimited: false,
  advanceBookingHours: 48,
  specialtyClassCredits: 2,
  creditExpiration: 2,  // months
  benefits: ['4 classes per month', '...'],
  founderSlotsTotal: 100,
  founderSlotsUsed: 45,
  releaseDate: Date
}
```

### UserMembership
```javascript
{
  userId: ObjectId,
  membershipTier: 'fever-starter',
  pricingTier: 'founders-1',
  status: 'active' | 'cancelled' | 'pending-cancellation',
  startDate: Date,
  nextBillingDate: Date,
  cancellationDate: Date,

  // Credits
  creditsTotal: 4,
  creditsRemaining: 3,
  creditsExpireDate: Date,

  // Billing
  monthlyPrice: 60,
  paymentMethod: 'manual',
  stripeSubscriptionId: null,

  // Tracking
  totalClassesAttended: 47,
  lastRewardMilestone: 0,

  // Discounts
  hasFirstMonthDiscount: true,
  firstMonthDiscountPercent: 15,

  notes: 'Paid via Venmo @username'
}
```

---

## Testing

### Test User Membership Flow

1. **Create test user** (register or create in admin)
2. **Assign membership**:
   ```bash
   POST /api/memberships/admin/assign
   {
     "userId": "test_user_id",
     "membershipTier": "fever-starter",
     "pricingTier": "founders-1",
     "monthlyPrice": 60,
     "paymentMethod": "manual",
     "creditsTotal": 4
   }
   ```
3. **Check membership**:
   ```bash
   GET /api/memberships/my-membership
   ```
4. **Deduct credit**:
   ```bash
   POST /api/memberships/deduct-credits
   { "amount": 1 }
   ```
5. **Record attendance**:
   ```bash
   POST /api/memberships/record-attendance
   ```

---

## Commit Changes

When ready to commit:

```bash
git add server/models/Membership.js
git add server/routes/memberships.js
git add server/models/Settings.js
git add server/server.js
git add server/scripts/seedMembershipTiers.js
git add MEMBERSHIP_SYSTEM.md

git commit -m "Add comprehensive membership tier system with manual payment tracking"

git push
```

---

## Next Steps

1. ✅ **Seed membership tiers** (`node scripts/seedMembershipTiers.js`)
2. ✅ **Configure payment settings** in Admin Dashboard
3. ⏳ **Build frontend UI** for:
   - Membership selection page
   - User membership dashboard
   - Admin membership management interface
4. ⏳ **Integrate with booking system**:
   - Check membership before booking
   - Deduct credits on confirmation
   - Enforce advance booking rules
5. ⏳ **Setup Stripe** when ready for automated billing

---

## Support

For questions or issues:
- Check API logs in Vercel Functions
- Review membership records in MongoDB Atlas
- Test endpoints with Postman or similar tool
