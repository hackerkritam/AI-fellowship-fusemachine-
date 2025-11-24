# ✅ KYC System - Pre-Deployment Checklist

**System**: Automated KYC Verification  
**Version**: 1.0.0  
**Date**: November 17, 2025  

---

## 🎯 Phase 1: Setup (Est. 30 minutes)

### Supabase Setup
- [ ] Create Supabase project at supabase.com
- [ ] Copy project URL
- [ ] Copy anon key
- [ ] Copy service role key (store securely)
- [ ] Note the Project ID

### Environment Variables
- [ ] Create `.env.local` file in root
- [ ] Add `VITE_SUPABASE_URL=https://xxxxx.supabase.co`
- [ ] Add `VITE_SUPABASE_ANON_KEY=eyxxxxx`
- [ ] Save and verify file exists

### Database Setup
- [ ] Copy migration SQL from `supabase/migrations/`
- [ ] Paste into Supabase SQL Editor
- [ ] Run migration (should create all tables)
- [ ] Verify tables created:
  - [ ] `kyc_applications`
  - [ ] `user_roles`
  - [ ] `audit_logs`
  - [ ] `storage.buckets`

### Storage Bucket
- [ ] Go to Supabase Storage
- [ ] Create bucket named `kyc-documents`
- [ ] Set to PUBLIC (important!)
- [ ] Set file size limit to 10MB
- [ ] Allow MIME types: image/*, video/*

---

## 🎯 Phase 2: Hugging Face Setup (Est. 10 minutes)

### Account & Token
- [ ] Go to huggingface.co
- [ ] Sign up or log in
- [ ] Go to Settings → Access Tokens
- [ ] Create new token with "read" permission
- [ ] Copy token (won't show again!)

### Supabase Secrets
- [ ] Go to Supabase Project Settings
- [ ] Find Edge Functions section
- [ ] Click Environment Variables
- [ ] Add new variable:
  - [ ] Name: `HUGGINGFACE_API_KEY`
  - [ ] Value: Your Hugging Face token
- [ ] Click Save

### Verify Setup
- [ ] Test API at: `https://api-inference.huggingface.co/models/microsoft/trocr-large-printed`
- [ ] Send test request with token in header
- [ ] Should return success (not 401/403)

---

## 🎯 Phase 3: Edge Function Deployment (Est. 15 minutes)

### Install Supabase CLI
- [ ] Run: `npm install -g supabase`
- [ ] Verify: `supabase --version`

### Link Project
- [ ] Run: `supabase link --project-ref YOUR_PROJECT_ID`
- [ ] Authenticate with Supabase account
- [ ] Project should link successfully

### Verify Function Exists
- [ ] Check `supabase/functions/verify-kyc/index.ts` exists
- [ ] Verify file has content (not empty)
- [ ] Check for imports at top

### Deploy Function
- [ ] Run: `supabase functions deploy verify-kyc`
- [ ] Should show "Deployed successfully"
- [ ] Note the function URL

### Verify Deployment
- [ ] Run: `supabase functions list`
- [ ] Should show `verify-kyc` in list
- [ ] Status should be "Active"

---

## 🎯 Phase 4: Frontend Setup (Est. 20 minutes)

### Install Dependencies
- [ ] Run: `npm install`
- [ ] Wait for completion (no errors)
- [ ] Check node_modules exists

### Verify Imports
- [ ] Check `src/App.tsx` has new routes
- [ ] Check `src/pages/AdminKYCReview.tsx` exists
- [ ] Check `src/pages/ApplicationDetail.tsx` exists
- [ ] Check `src/services/kyc-verification.ts` exists

### Start Dev Server
- [ ] Run: `npm run dev`
- [ ] Should say "Local: http://localhost:5173"
- [ ] Open URL in browser
- [ ] Should see login page (no errors)

### Check Console
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Should show no red errors
- [ ] Check Network tab (no 404s for chunks)

---

## 🎯 Phase 5: Create Test Admin (Est. 10 minutes)

### Create User Account
- [ ] Go to http://localhost:5173
- [ ] Click "Sign Up"
- [ ] Enter test email (e.g., admin@test.com)
- [ ] Enter password
- [ ] Click "Sign Up"
- [ ] Verify email (if required in Supabase)

### Get User ID
- [ ] Go to Supabase Dashboard
- [ ] Go to Authentication → Users
- [ ] Find your test user
- [ ] Copy the UUID in "ID" column

### Add Admin Role
- [ ] Go to SQL Editor in Supabase
- [ ] Run this SQL (replace with your UUID):
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE_YOUR_UUID_HERE', 'admin');
```
- [ ] Should show "Query successful"

### Verify Admin Role
- [ ] Go back to frontend (might need refresh)
- [ ] Dashboard should now show "Admin Dashboard"
- [ ] Should show "Admin" badge in top right

---

## 🎯 Phase 6: End-to-End Testing (Est. 30 minutes)

### Test User Submission
- [ ] Create new test user (regular user)
- [ ] Go to KYC Form
- [ ] Fill Step 1 (Personal Info):
  - [ ] Full Name
  - [ ] Date of Birth
  - [ ] Gender
  - [ ] Father's Name
  - [ ] Address fields
- [ ] Go to Step 2 (Documents):
  - [ ] Aadhaar Number
  - [ ] PAN Number
  - [ ] Upload Aadhaar Front image
  - [ ] Upload Aadhaar Back image
  - [ ] Upload PAN image
- [ ] Go to Step 3 (Video):
  - [ ] Allow camera access
  - [ ] Click "Start Recording"
  - [ ] Should record for 10 seconds
  - [ ] Should auto-stop and show video
- [ ] Go to Step 4 (Review):
  - [ ] Verify all data shown
  - [ ] Click "Submit Application"
- [ ] Should see success message
- [ ] Should redirect to Dashboard

### Check Database
- [ ] Verify record in `kyc_applications` table
- [ ] Check files uploaded to storage
- [ ] Check audit log created

### Check Verification
- [ ] Wait 10-15 seconds
- [ ] Refresh dashboard
- [ ] Status should change from "pending"
- [ ] Should see AI scores (if verification ran)

### Test Dashboard (Regular User)
- [ ] Verify application shows in list
- [ ] Click on application
- [ ] Should go to `/application/:id`
- [ ] Should show all details
- [ ] Should show verification scores

### Test Admin Review
- [ ] Switch to admin user (logout and login as admin)
- [ ] Dashboard should show all applications
- [ ] Click on application
- [ ] Should go to `/admin/review/:id`
- [ ] Should show admin interface
- [ ] Should see approve/reject buttons

### Test Admin Approval
- [ ] Click "Status" dropdown
- [ ] Select "Approved"
- [ ] Click "Approve Application"
- [ ] Should show success message
- [ ] Go back to applications list
- [ ] Status should show "Approved"

### Test Admin Rejection
- [ ] Create another test submission
- [ ] Go to admin review
- [ ] Select "Rejected" from Status
- [ ] Type rejection reason
- [ ] Click "Reject Application"
- [ ] Should show success message

### Test Document Download
- [ ] In admin review page
- [ ] Click "Download Aadhaar Front"
- [ ] File should download
- [ ] Verify file is the uploaded document

---

## 🎯 Phase 7: Error Testing (Est. 20 minutes)

### Test Network Errors
- [ ] Open DevTools → Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Try submitting form
- [ ] Should handle gracefully
- [ ] Should show error message

### Test File Upload Errors
- [ ] Try uploading file > 10MB
- [ ] Should show error
- [ ] Try uploading non-image file
- [ ] Should show error

### Test API Errors
- [ ] In DevTools, block Hugging Face API
- [ ] Submit KYC form
- [ ] Verification should fail gracefully
- [ ] Status should be "under_review"
- [ ] Should log error in admin notes

### Test Missing Fields
- [ ] Try submitting without video
- [ ] Should either:
  - [ ] Show validation error, or
  - [ ] Submit and set status to "under_review"
- [ ] System should not crash

### Test Concurrent Submissions
- [ ] Open two browser windows
- [ ] Submit from both simultaneously
- [ ] Both should succeed
- [ ] Both should appear in dashboard

---

## 🎯 Phase 8: Performance Testing (Est. 15 minutes)

### Measure Times
- [ ] Time from submission to dashboard update:
  - [ ] Target: < 30 seconds
  - [ ] Actual: _______
- [ ] Time for page loads:
  - [ ] Home: _______
  - [ ] Dashboard: _______
  - [ ] Form: _______
  - [ ] Admin Review: _______

### Monitor API Calls
- [ ] Open Network tab
- [ ] Check Hugging Face API calls
- [ ] Should see OCR, face, liveness endpoints
- [ ] Response times reasonable?
- [ ] Any timeout errors?

### Check Database Indexes
- [ ] Run Supabase query:
```sql
SELECT * FROM pg_indexes WHERE tablename = 'kyc_applications';
```
- [ ] Should see indexes on:
  - [ ] user_id
  - [ ] status
  - [ ] created_at

---

## 🎯 Phase 9: Security Testing (Est. 15 minutes)

### Test User Isolation
- [ ] Login as user 1
- [ ] Note application ID
- [ ] Login as user 2
- [ ] Try to access user 1's app via URL
- [ ] Should redirect to dashboard (access denied)

### Test Admin Access
- [ ] Remove admin role from test user
- [ ] Try to access `/admin/review/:id`
- [ ] Should redirect (access denied)
- [ ] Re-add admin role
- [ ] Should be able to access

### Test API Key Security
- [ ] Check `.env.local` not committed
- [ ] Verify `.gitignore` includes `.env.local`
- [ ] Check no API keys in code
- [ ] Verify Hugging Face key only in Supabase secrets

### Test Document Security
- [ ] Get signed URL for document
- [ ] Document URL should have expiration
- [ ] Try accessing after 2 hours
- [ ] Should be denied (expired)

---

## 🎯 Phase 10: Documentation Review (Est. 10 minutes)

### Review Documentation
- [ ] Read [START_HERE.md](./START_HERE.md)
- [ ] Read [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [ ] Skim [KYC_SYSTEM_DOCUMENTATION.md](./KYC_SYSTEM_DOCUMENTATION.md)
- [ ] Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for any missed steps

### Check Code Comments
- [ ] Components have JSDoc comments
- [ ] Functions have parameter descriptions
- [ ] Complex logic is explained
- [ ] TODO comments are noted

### Verify README
- [ ] Check if main [README.md](./README.md) needs update
- [ ] Point to START_HERE.md
- [ ] Include quick start commands

---

## 🎯 Phase 11: Pre-Production Checklist (Est. 15 minutes)

### Code Quality
- [ ] No console.log() left in production code (ok in dev)
- [ ] No commented-out code blocks
- [ ] Type safety: All TypeScript strict mode
- [ ] Error handling: Try-catch blocks where needed
- [ ] No hardcoded values (use env vars)

### Performance
- [ ] Bundle size reasonable
- [ ] No N+1 queries in components
- [ ] Images optimized
- [ ] API calls batched where possible

### Security
- [ ] No sensitive data in localStorage
- [ ] API keys only in env vars / secrets
- [ ] CORS properly configured
- [ ] RLS policies enabled
- [ ] Input validation on all forms

### Testing
- [ ] Tested all user flows
- [ ] Tested all admin flows
- [ ] Error cases handled
- [ ] Performance acceptable

### Documentation
- [ ] Code commented
- [ ] Setup guide complete
- [ ] API documentation done
- [ ] Troubleshooting guide created

---

## 🎯 Phase 12: Production Deployment (Est. 30 minutes)

### Build & Test Build
- [ ] Run: `npm run build`
- [ ] Check `dist/` folder created
- [ ] No build errors
- [ ] Size reasonable (< 1MB gzip)

### Production Environment Setup
- [ ] Create production Supabase project (optional - can use same)
- [ ] Get production credentials
- [ ] Create `.env.production.local`
- [ ] Add production credentials

### Deploy to Vercel
- [ ] Push code to GitHub
- [ ] Connect to Vercel
- [ ] Set environment variables
- [ ] Deploy

### Or Deploy to Other Hosting
- [ ] If using different host, follow their guide
- [ ] Set environment variables
- [ ] Configure domain/HTTPS
- [ ] Test deployed site

### Verify Production
- [ ] Visit deployed URL
- [ ] Login and test flow
- [ ] Check API calls go to production DB
- [ ] Verify verification works

### Setup Monitoring
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Setup analytics (Google Analytics, etc.)
- [ ] Setup uptime monitoring
- [ ] Setup log aggregation

---

## 📊 Final Verification Scores

### Functionality: ___/100
- [ ] User submission: ___/25
- [ ] Verification: ___/25
- [ ] Admin review: ___/25
- [ ] Overall experience: ___/25

### Performance: ___/100
- [ ] Page load speed: ___/25
- [ ] Form responsiveness: ___/25
- [ ] Database speed: ___/25
- [ ] API speed: ___/25

### Quality: ___/100
- [ ] Code quality: ___/25
- [ ] Documentation: ___/25
- [ ] Test coverage: ___/25
- [ ] Security: ___/25

### Overall Score: ___/100

---

## 🎉 Go-Live Checklist

Before making system live:

- [ ] All tests passed
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Monitoring setup
- [ ] Backup configured
- [ ] Support plan in place
- [ ] Team trained

### Go-Live Approval
- [ ] Project Lead: _______________ Date: _____
- [ ] Tech Lead: _______________ Date: _____
- [ ] QA: _______________ Date: _____

---

## 📞 Post-Launch

### First 24 Hours
- [ ] Monitor error logs
- [ ] Check API performance
- [ ] Verify emails sent (if enabled)
- [ ] Check user feedback

### First Week
- [ ] Review analytics
- [ ] Fix any issues
- [ ] Optimize performance
- [ ] Update documentation

### First Month
- [ ] Analyze verification accuracy
- [ ] Gather user feedback
- [ ] Plan Phase 2 features
- [ ] Update roadmap

---

## 📝 Notes & Comments

```
Phase 1 Status: _________________________
Phase 2 Status: _________________________
Phase 3 Status: _________________________
...

Issues Found:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Solutions Applied:
1. ___________________________________
2. ___________________________________
3. ___________________________________

Team Sign-off:
___________________________________
___________________________________
```

---

## 🎊 Success!

If all checkboxes are complete, your system is ready for production! 

**Status**: ✅ READY TO LAUNCH

**Next**: Monitor production and gather feedback for Phase 2 improvements.

---

**Checklist Version**: 1.0  
**Last Updated**: November 17, 2025  
**Completion Target**: 3 hours  
**Actual Time Taken**: _______  
**Notes**: _______________________
