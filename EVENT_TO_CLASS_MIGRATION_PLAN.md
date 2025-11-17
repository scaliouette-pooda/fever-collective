# Event → Class Terminology Migration Plan

**Status**: Planning Phase
**Impact**: Breaking Change
**Estimated Time**: 2-3 hours
**Risk Level**: HIGH ⚠️

---

## 🎯 Objective

Rename all "Event" terminology to "Class" throughout the application to better reflect that The Fever Studio offers fitness classes, not generic events.

---

## 📊 Scope Analysis

### Database Changes
- **Collection**: `events` → `classes`
- **Model**: `Event` → `Class`
- **Impact**: All existing event data must be migrated

### Backend Changes (Server)
**Files to Modify**: ~15 files
- `models/Event.js` → `models/Class.js`
- `routes/events.js` → `routes/classes.js`
- Update imports in: bookings.js, waitlist.js, automatedEmailService.js, emailAutomation.js
- Update API endpoint registrations in server.js

### Frontend Changes (Client)
**Files to Modify**: ~20+ components
- API endpoint calls: `/api/events` → `/api/classes`
- Variable names: `event` → `class` (careful with reserved keyword!)
- UI text: "Event" → "Class"
- Props: `eventId` → `classId`, `eventTitle` → `classTitle`, etc.

### API Endpoints to Update
```
GET    /api/events           → /api/classes
POST   /api/events           → /api/classes
GET    /api/events/:id       → /api/classes/:id
PUT    /api/events/:id       → /api/classes/:id
DELETE /api/events/:id       → /api/classes/:id
```

---

## ⚠️ Critical Risks & Challenges

### 1. **JavaScript Reserved Keyword** ⚠️⚠️⚠️
**Problem**: `class` is a reserved keyword in JavaScript (ES6 classes)
```javascript
// ❌ This will break:
const class = await Class.findById(id);

// ✅ Must use alternative naming:
const fitnessClass = await Class.findById(id);
const classItem = await Class.findById(id);
const studioClass = await Class.findById(id);
```

**Recommended Variable Naming Convention**:
- Model: `Class` (capitalized, okay as model name)
- Single instance: `classItem` or `fitnessClass`
- Multiple instances: `classes` (safe, plural)
- Function params: `classId`, `classData`, `classDetails`

### 2. **Database Migration**
**Problem**: Existing MongoDB collection `events` must be renamed

**Options**:
- **A) Mongoose model alias** (backward compatible, no data migration)
- **B) MongoDB rename collection** (clean but requires migration)
- **C) Create new collection + dual write** (safest but complex)

### 3. **Breaking API Changes**
**Impact**: Any external integrations or saved API calls will break
- Mobile apps
- Third-party integrations
- Bookmarked admin pages
- Saved API requests

### 4. **Frontend Build Cache**
**Problem**: Cached old code may reference `/api/events`
**Solution**: Clear browser cache, force reload after deployment

---

## 🗂️ Detailed File Change List

### Server Files (Backend)

#### Models
```
✏️ RENAME: models/Event.js → models/Class.js
```

**Changes in Event.js**:
```javascript
// Before:
const eventSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Event', eventSchema);

// After:
const classSchema = new mongoose.Schema({ ... });
module.exports = mongoose.model('Class', classSchema);
// OR for backward compatibility:
module.exports = mongoose.model('Class', classSchema, 'events'); // Keep 'events' collection name
```

#### Routes
```
✏️ RENAME: routes/events.js → routes/classes.js
```

**Changes in events.js**:
```javascript
// Before:
const Event = require('../models/Event');
router.get('/', async (req, res) => {
  const events = await Event.find();
  res.json(events);
});

// After:
const Class = require('../models/Class');
router.get('/', async (req, res) => {
  const classes = await Class.find();
  res.json(classes);
});
```

#### Files Requiring Import Updates
```
✏️ UPDATE: routes/bookings.js
  - Line ~4: const Event = require('../models/Event');
  → const Class = require('../models/Class');
  - Update all Event.findById() → Class.findById()
  - Update variable names: event → classItem

✏️ UPDATE: routes/waitlist.js
  - Similar changes to bookings.js

✏️ UPDATE: services/automatedEmailService.js
  - Update Event import
  - Update event references in email templates

✏️ UPDATE: services/emailAutomation.js
  - Update Event import
  - Update event references

✏️ UPDATE: server.js
  - Line ~71: const eventRoutes = require('./routes/events');
  → const classRoutes = require('./routes/classes');

  - Line ~89: app.use('/api/events', eventRoutes);
  → app.use('/api/classes', classRoutes);
```

#### Other Affected Models
```
✏️ UPDATE: models/Booking.js
  - event field reference should stay as-is (just references Class model)
  - Update populate calls: .populate('event') still works

✏️ UPDATE: models/Waitlist.js
  - Similar to Booking.js
```

### Client Files (Frontend)

#### API Endpoint Updates
All files making API calls to `/api/events`:

```
✏️ UPDATE: components/AdminDashboard.js
  - api.get('/events') → api.get('/classes')
  - Variable names: events → classes
  - UI text: "Event" → "Class"

✏️ UPDATE: components/EventList.js → components/ClassList.js (RENAME)
  - All event references → class references

✏️ UPDATE: components/EventDetail.js → components/ClassDetail.js (RENAME)
  - Similar changes

✏️ UPDATE: components/BookingForm.js
  - event prop → classItem prop
  - eventId → classId
  - UI text updates

✏️ UPDATE: components/Waitlist.js
  - Similar pattern

✏️ UPDATE: Any other components using /api/events
```

#### Variable Naming Pattern for Frontend
```javascript
// ✅ SAFE patterns:
const [classes, setClasses] = useState([]);
const classItem = classes.find(...);
const selectedClass = ...;
const classDetails = ...;

// ❌ AVOID:
const class = ...; // Reserved keyword!
```

---

## 📋 Migration Strategy

### **Recommended Approach: Phased Migration**

### Phase 1: Backend Model & Routes (Non-Breaking)
**Goal**: Update backend without breaking existing API

1. **Update Model with Alias** (Backward Compatible)
   ```javascript
   // models/Class.js
   const classSchema = new mongoose.Schema({ ... });
   // Use 3rd parameter to keep 'events' collection name
   module.exports = mongoose.model('Class', classSchema, 'events');
   ```

2. **Support Both Routes Temporarily**
   ```javascript
   // server.js
   const classRoutes = require('./routes/classes');
   app.use('/api/classes', classRoutes);  // New
   app.use('/api/events', classRoutes);   // Old (deprecated)
   ```

3. **Update Internal Code**
   - Update all `const Event = require(...)` to `const Class`
   - Update variable names carefully (avoid `class` keyword)
   - Test thoroughly

### Phase 2: Frontend Updates
4. **Update Client API Calls**
   - Change `/api/events` → `/api/classes` in all components
   - Update variable names
   - Update UI text

5. **Update Props & Interfaces**
   - `eventId` → `classId`
   - `eventTitle` → `classTitle`
   - etc.

### Phase 3: Cleanup (Breaking)
6. **Remove Deprecated Routes**
   - Remove `/api/events` alias
   - Force clients to use new endpoints

7. **Optional: Rename Database Collection**
   ```javascript
   // MongoDB shell or migration script
   db.events.renameCollection('classes');

   // Then update model to:
   module.exports = mongoose.model('Class', classSchema); // No 3rd param
   ```

---

## 🛡️ Risk Mitigation

### 1. **Backup Database**
```bash
# Before starting
mongodump --uri="your-connection-string" --out=backup-before-class-migration
```

### 2. **Feature Flag**
```javascript
// settings.js
useClassTerminology: {
  type: Boolean,
  default: false  // Enable after migration complete
}
```

### 3. **Rollback Plan**
```bash
# Rollback commands
git revert HEAD
mongorestore backup-before-class-migration
npm run build
```

### 4. **Testing Checklist**
- [ ] Create new class
- [ ] Edit existing class
- [ ] Delete class
- [ ] Book a class
- [ ] View class list
- [ ] View class details
- [ ] Waitlist functionality
- [ ] Email automation triggers
- [ ] ClassPass integration (uses eventTitle in emails)
- [ ] Admin dashboard displays
- [ ] Mobile responsiveness

---

## 📝 Detailed Step-by-Step Execution Plan

### Step 1: Preparation (15 min)
```bash
# Create feature branch
git checkout -b refactor/event-to-class-terminology

# Backup database
mongodump --uri="$MONGODB_URI" --out=backup-$(date +%Y%m%d)

# Run tests to establish baseline
npm test
```

### Step 2: Update Backend Model (30 min)
1. Rename `models/Event.js` → `models/Class.js`
2. Update schema variable names internally
3. Update model export (keep collection name for now)
4. Test model imports

### Step 3: Update Backend Routes (45 min)
1. Rename `routes/events.js` → `routes/classes.js`
2. Update all Event imports → Class
3. Update variable names (use classItem, fitnessClass)
4. Update server.js registrations (add both routes temporarily)
5. Test all route endpoints

### Step 4: Update Backend Dependencies (30 min)
1. Update bookings.js
2. Update waitlist.js
3. Update automatedEmailService.js
4. Update emailAutomation.js
5. Test all affected features

### Step 5: Update Frontend Components (60 min)
1. Update API endpoint calls
2. Update variable names
3. Update props
4. Update UI text (all user-facing strings)
5. Rename component files if needed

### Step 6: Update Documentation (15 min)
1. Update README
2. Update API documentation
3. Update ClassPass setup guide (mentions eventTitle)

### Step 7: Testing (45 min)
1. Manual testing of all features
2. Check browser console for errors
3. Test booking flow end-to-end
4. Test admin CRUD operations
5. Test email automation triggers

### Step 8: Build & Deploy Prep (15 min)
1. Build client: `npm run build`
2. Check bundle size
3. Review git diff
4. Create comprehensive commit message

---

## 🔍 Potential Gotchas

### 1. **Mongoose Populate**
```javascript
// These still work even after rename:
await Booking.findById(id).populate('event');  // Still valid!
// Because 'event' is the field name in Booking schema, not the model name
```

### 2. **Email Templates**
Check for hardcoded "event" text in:
- Automated campaign templates
- ClassPass emails (eventTitle placeholder)
- Booking confirmation emails

### 3. **CSS Class Names**
```css
/* DON'T change these - they're CSS classes, not fitness classes! */
.event-card { }
.event-list { }
```
Decision: Keep or rename? (Consider keeping `.event-` prefix for CSS to avoid confusion)

### 4. **URL Routes**
```javascript
// Frontend routes
<Route path="/events/:id" />  →  <Route path="/classes/:id" />
// Remember to update Navigation links!
```

---

## ✅ Success Criteria

Migration is successful when:
- [ ] All API endpoints respond correctly at `/api/classes`
- [ ] Database queries work correctly
- [ ] No console errors in browser
- [ ] All booking flows work
- [ ] Waitlist functionality works
- [ ] Email automation triggers correctly
- [ ] Admin dashboard CRUD operations work
- [ ] ClassPass integration still functional
- [ ] Build completes without errors
- [ ] All tests pass

---

## 📞 Decision Points

Before proceeding, decide on:

### 1. Variable Naming Convention
- **Option A**: `classItem` (clear, unambiguous)
- **Option B**: `fitnessClass` (descriptive, no ambiguity)
- **Option C**: `studioClass` (brand-specific)

**Recommendation**: `classItem` for objects, `classes` for arrays

### 2. Database Collection Name
- **Option A**: Keep as `events` (backward compatible, less risky)
- **Option B**: Rename to `classes` (clean, requires migration)

**Recommendation**: Keep as `events` initially, rename later if needed

### 3. Dual Route Support
- **Option A**: Support both `/api/events` and `/api/classes` for 30 days
- **Option B**: Breaking change immediately

**Recommendation**: Option A for safety

### 4. CSS Class Names
- **Option A**: Rename `.event-*` to `.class-*`
- **Option B**: Keep CSS as-is (avoid confusion with fitness classes)

**Recommendation**: Option B (keep CSS unchanged)

---

## 📦 Estimated Deliverables

After migration:
1. ✅ Renamed model: `models/Class.js`
2. ✅ Renamed route: `routes/classes.js`
3. ✅ Updated 15+ server files
4. ✅ Updated 20+ client components
5. ✅ Migration documentation
6. ✅ Updated README
7. ✅ Comprehensive commit with detailed changes

---

## 🚀 Next Steps

**Ready to proceed?** Choose execution approach:

1. **Automated with Review**: I make all changes, you review diff before committing
2. **Guided Manual**: I provide exact commands and you execute step-by-step
3. **Hybrid**: I do backend, you do frontend (or vice versa)
4. **Pause**: Review this plan further before starting

**What's your preference?**
