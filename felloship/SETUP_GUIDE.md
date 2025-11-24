# Setup Guide - KYC Verification System

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd verify-flow-main
npm install
```

### 2. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Click "New Project"
- Fill in project details
- Save your URL and anon key

### 3. Create .env.local
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxx
```

### 4. Run Migrations
```bash
supabase link --project-ref your_project_id
supabase db push
```

### 5. Get Hugging Face API Key
- Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Create new token with "read" permission
- Copy the token

### 6. Set Edge Function Environment Variables
```bash
supabase secrets set HUGGINGFACE_API_KEY=your_token_here
```

### 7. Deploy Edge Function
```bash
supabase functions deploy verify-kyc
```

### 8. Start Development Server
```bash
npm run dev
```

## Detailed Setup

### Supabase Project Setup

#### 1. Create Storage Bucket

```bash
supabase storage create-bucket kyc-documents --public
```

Or via UI:
1. Go to Storage in Supabase dashboard
2. Click "New Bucket"
3. Name: `kyc-documents`
4. Make it public
5. Click Create

#### 2. Create Admin User

First, create a user normally via the app, then:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id', 'admin');
```

To find user ID:
```sql
SELECT id, email FROM auth.users;
```

#### 3. Verify RLS Policies

Check if policies are enabled:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'kyc_applications';
```

If missing, apply policies in SQL editor:

```sql
-- Users can read own applications
CREATE POLICY "Users can read own KYC applications"
  ON public.kyc_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own applications  
CREATE POLICY "Users can insert own KYC applications"
  ON public.kyc_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all KYC applications"
  ON public.kyc_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update
CREATE POLICY "Admins can update KYC applications"
  ON public.kyc_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### Hugging Face API Setup

#### 1. Create Account
- Visit [huggingface.co](https://huggingface.co)
- Sign up with email
- Verify email

#### 2. Create API Token
- Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
- Click "New token"
- Name: "KYC Verification"
- Type: "read"
- Click "Generate"
- Copy token (won't be shown again!)

#### 3. Add to Supabase

Via CLI:
```bash
supabase secrets set HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
```

Via Dashboard:
1. Go to Project Settings → Edge Functions → Environment Variables
2. Click "Add"
3. Name: `HUGGINGFACE_API_KEY`
4. Value: Your HuggingFace token
5. Click Save

### Edge Function Deployment

#### 1. Verify Function Exists
```bash
ls supabase/functions/verify-kyc/
```

Should show:
- `index.ts` - Main function code

#### 2. Deploy Function
```bash
supabase functions deploy verify-kyc --project-ref your_project_id
```

#### 3. Verify Deployment
```bash
supabase functions list
```

Should show `verify-kyc` with status "Active"

#### 4. Test Function (Optional)
```bash
supabase functions invoke verify-kyc --project-ref your_project_id \
  --body '{"kycId":"test-id"}'
```

## Configuration Details

### Environment Variables

**Frontend (.env.local)**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]

# Optional - for development
VITE_API_URL=http://localhost:3000
```

**Edge Function (Supabase Secrets)**
```env
HUGGINGFACE_API_KEY=hf_[your-token]
```

### Verification Thresholds

Edit `supabase/functions/verify-kyc/index.ts`:

```typescript
// Approval thresholds (adjust as needed)
const FACE_MATCH_THRESHOLD = 80;  // 0-100
const LIVENESS_THRESHOLD = 80;    // 0-100
const REJECTION_THRESHOLD = 60;   // 0-100

if (faceMatchScore >= FACE_MATCH_THRESHOLD && 
    livenessScore >= LIVENESS_THRESHOLD) {
  status = "approved";
}
```

### Storage Configuration

Edit `supabase/migrations/[timestamp]_*.sql`:

```sql
-- Max file size (10 MB in this example)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  true,
  10485760,  -- 10 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'video/webm',
    'video/mp4'
  ]
);
```

## Development Workflow

### 1. Local Development
```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Emulate Supabase locally
supabase start

# Terminal 3: Watch Edge Functions
supabase functions develop verify-kyc
```

### 2. Testing Verification Flow

**Step 1**: Create test user
- Go to http://localhost:5173/auth
- Sign up with test email

**Step 2**: Submit KYC application
- Navigate to /kyc-form
- Fill all fields
- Upload test images
- Record video
- Submit

**Step 3**: Check verification results
- Go to /dashboard
- See status (should be pending/under_review/approved/rejected)
- Check scores

**Step 4**: Admin review (if applicable)
- Add admin role to test user
- Go to /dashboard (should show all applications)
- Click application → /admin/review/:id
- Review and approve/reject

### 3. Debugging

**Check Edge Function Logs**:
```bash
supabase functions logs verify-kyc --project-ref your_project_id
```

**Check Browser Console**:
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for API calls

**Check Supabase Logs**:
1. Go to Supabase Dashboard
2. Logs → Edge Function
3. Filter by verify-kyc

## Production Deployment

### 1. Build Frontend
```bash
npm run build
```

### 2. Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel login
vercel deploy
```

### 3. Configure Environment
In Vercel dashboard:
- Project → Settings → Environment Variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

### 4. Enable Supabase Edge Functions
```bash
supabase functions deploy verify-kyc --project-ref your_prod_project_id
```

### 5. Update Email Notifications (Optional)
Set up Supabase email templates for:
- Application submitted
- Application approved
- Application rejected
- Application under review

## Troubleshooting

### Issue: "CORS Error" when submitting
**Solution**:
1. Check Supabase CORS settings
2. Verify anon key is correct
3. Check browser console for actual error

### Issue: "Edge Function Not Found"
**Solution**:
```bash
# Redeploy function
supabase functions deploy verify-kyc --force

# Check status
supabase functions list
```

### Issue: "Hugging Face API Error"
**Solution**:
1. Check API token is valid
2. Verify token has "read" permission
3. Check rate limits (free tier: 30k API calls/month)
4. Check function logs

### Issue: "Storage Upload Failed"
**Solution**:
1. Verify bucket exists and is public
2. Check file size < 10MB
3. Check file type is allowed (image/*, video/*)
4. Check user has write permission

### Issue: "Liveness Video Not Recording"
**Solution**:
1. Check browser permissions for camera
2. Try different browser
3. Check Network Security (HTTPS required)
4. Clear browser cache

## Performance Tuning

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_kyc_user_id ON kyc_applications(user_id);
CREATE INDEX idx_kyc_status ON kyc_applications(status);
CREATE INDEX idx_kyc_created_at ON kyc_applications(created_at DESC);
```

### Edge Function Optimization
- Cache models in memory
- Implement request throttling
- Set timeout limits
- Use connection pooling

## Monitoring & Alerts

### Setup Uptime Monitoring
1. Use Supabase Logs
2. Monitor Edge Function errors
3. Setup email alerts for failures

### Key Metrics to Track
- Average verification time
- Approval rate vs rejection rate
- API error rate
- Storage usage

## Security Checklist

- [ ] Supabase project has RLS enabled
- [ ] API key is restricted (anon key only)
- [ ] Service role key is never exposed
- [ ] Hugging Face API key is in secrets, not code
- [ ] Storage bucket has appropriate permissions
- [ ] HTTPS is enforced
- [ ] User data is encrypted at rest
- [ ] Audit logs are enabled
- [ ] Regular backups are configured

## Next Steps

1. **Customize Verification Logic**
   - Adjust thresholds
   - Integrate additional APIs
   - Add custom rules

2. **Enhance UI**
   - Add progress indicators
   - Implement notifications
   - Add analytics dashboard

3. **Integrate External Services**
   - Email notifications
   - SMS OTP
   - Background checks
   - Credit verification

4. **Scale for Production**
   - Setup CDN
   - Enable caching
   - Optimize database queries
   - Monitor performance

---

For more help, check:
- [Supabase Docs](https://supabase.com/docs)
- [Hugging Face API Docs](https://huggingface.co/docs/api-inference)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
