# Quick Reference Guide

## 🚀 Quick Start (5 minutes)

### 1. Setup Supabase
```bash
# Go to supabase.com → Create Project
# Get URL and Key from Project Settings

# Run migrations
supabase db push

# Create .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxx
```

### 2. Setup Hugging Face
```bash
# Go to huggingface.co/settings/tokens
# Create token → Copy it

# Set in Supabase
supabase secrets set HUGGINGFACE_API_KEY=hf_xxxxx
```

### 3. Deploy & Test
```bash
# Deploy edge function
supabase functions deploy verify-kyc

# Start dev server
npm install && npm run dev

# Visit http://localhost:5173
```

---

## 📖 User Flows

### User Journey
```
1. Sign up → /auth
2. Fill KYC form → /kyc-form
3. Submit → Auto verification triggers
4. Check status → /dashboard
5. View details → /application/:id
```

### Admin Journey
```
1. Login (must have admin role)
2. Dashboard shows all applications → /dashboard
3. Click application → /admin/review/:id
4. Review scores and documents
5. Approve or Reject
6. Add notes
7. Application updated with decision
```

---

## 🔑 Key Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Home page | Public |
| `/auth` | Sign up / Login | Public |
| `/dashboard` | Application list | Authenticated |
| `/kyc-form` | Submit KYC | Authenticated |
| `/application/:id` | User detail view | Authenticated (own only) |
| `/admin/review/:id` | Admin review | Admin only |

---

## 📊 Database Tables

### kyc_applications
```
id (UUID) - Primary key
user_id (UUID) - Which user
full_name, dob, gender, father_name - Personal info
address_line1-2, city, state, pincode - Address
aadhaar_number, pan_number - Document numbers
*_url - File storage paths
ocr_data (JSON) - Extracted text
face_match_score (0-100) - AI score
liveness_score (0-100) - AI score
status - 'pending', 'approved', 'rejected', 'under_review'
rejection_reason - Why rejected
admin_notes - Admin feedback
reviewed_by, reviewed_at - Who and when
```

### user_roles
```
user_id (UUID)
role - 'admin' or 'user'
```

### audit_logs
```
user_id (UUID)
action - What happened
entity_type, entity_id - What was affected
details (JSON) - Extra info
timestamp
```

---

## 🤖 Verification Process

```
User submits KYC
        ↓
Edge Function triggered
        ↓
Step 1: OCR on documents
├─ Read Aadhaar text
└─ Read PAN text
        ↓
Step 2: Face Matching
├─ Compare Aadhaar front to back
└─ Get confidence score (0-100%)
        ↓
Step 3: Liveness Detection
├─ Analyze video
└─ Get liveness score (0-100%)
        ↓
Step 4: Decision
├─ If scores ≥ 80% → APPROVED
├─ If scores < 60% → REJECTED
└─ Otherwise → UNDER_REVIEW
        ↓
Database updated
Admin notified (if needed)
```

---

## 🔐 User Roles

### Regular User
Can:
- Create account
- Submit KYC
- View own applications
- Resubmit if rejected

Cannot:
- See other users' apps
- Approve/reject
- Admin functions

### Admin User
Can:
- Do everything users can
- See all applications
- Approve/reject with notes
- Download documents
- View audit logs

To make admin:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin');
```

---

## 📱 Document Requirements

### Aadhaar Card
- Format: Image (JPG, PNG)
- Size: < 10MB
- Content: Front and back required
- Quality: Clear, readable text

### PAN Card
- Format: Image (JPG, PNG)
- Size: < 10MB
- Content: Front side
- Quality: Clear, readable text

### Liveness Video
- Format: WebM, MP4
- Duration: 10 seconds
- Size: < 10MB
- Content: Face clearly visible

---

## 🐛 Debugging

### Check Edge Function Logs
```bash
supabase functions logs verify-kyc
# Shows real-time logs from the function
```

### Check Browser Console
- F12 → Console tab
- Look for red errors
- Check network requests

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "CORS Error" | Wrong domain | Check SUPABASE_URL |
| "Not authenticated" | Session expired | Sign in again |
| "Edge function not found" | Not deployed | `supabase functions deploy verify-kyc` |
| "API Rate Limited" | Too many requests | Wait or upgrade plan |
| "Storage upload failed" | File too large | Use file < 10MB |

---

## 📊 Testing Checklist

### Basic Flow
- [ ] Sign up
- [ ] Fill KYC form
- [ ] Upload documents
- [ ] Record video
- [ ] Submit
- [ ] Check dashboard status
- [ ] View detail page

### Admin Review
- [ ] Login as admin
- [ ] View all apps
- [ ] Open detail view
- [ ] Download documents
- [ ] Approve/reject
- [ ] Check updated status

### Edge Cases
- [ ] Submit without video
- [ ] Large file upload
- [ ] Rapid form submission
- [ ] Network disconnect

---

## 📈 Performance Tips

### For Users
- Use good lighting for video
- Clear photo of documents
- Stable internet connection
- Close other tabs/apps

### For System
- Optimize images before upload
- Use CDN for static files
- Cache verification results
- Monitor API usage

---

## 💰 Cost Estimation

### Monthly Costs (per 1000 verifications)

| Service | Cost |
|---------|------|
| Supabase (Database + Storage) | $0-25 |
| Hugging Face API | $0-50 |
| Vercel Hosting | $0-20 |
| **Total** | **$0-95** |

### Production Scale (10,000 verifications/month)
- Supabase: ~$50
- Hugging Face: ~$50
- Vercel: ~$20
- **Total: ~$120/month**

---

## 🔗 Important Links

- **Supabase**: https://supabase.com
- **Hugging Face**: https://huggingface.co
- **Vercel**: https://vercel.com
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

---

## 📞 Support Resources

- 📖 [System Documentation](./KYC_SYSTEM_DOCUMENTATION.md)
- 🚀 [Setup Guide](./SETUP_GUIDE.md)
- 🤖 [AI Providers Guide](./AI_PROVIDERS_GUIDE.md)
- ✓ [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

---

## ⚡ Pro Tips

1. **Use Environment Variables**
   - Never hardcode API keys
   - Use .env.local for local development
   - Use Supabase secrets for production

2. **Optimize Images**
   - Compress before upload
   - Use WebP format if possible
   - Reduce to required resolution

3. **Monitor Performance**
   - Check function logs regularly
   - Track average verification time
   - Monitor storage usage

4. **User Communication**
   - Clear error messages
   - Explain rejection reasons
   - Provide resubmit guidance

5. **Admin Workflow**
   - Review high-risk applications first
   - Add detailed notes for decisions
   - Check audit logs regularly

---

## 🎓 Learning Resources

### Supabase
- [Docs](https://supabase.com/docs)
- [Tutorials](https://supabase.com/docs/guides)
- [Examples](https://github.com/supabase/supabase/tree/master/examples)

### React
- [Documentation](https://react.dev)
- [Hooks Guide](https://react.dev/reference/react)
- [Best Practices](https://react.dev/learn)

### Hugging Face
- [Documentation](https://huggingface.co/docs)
- [Model Hub](https://huggingface.co/models)
- [API Reference](https://huggingface.co/docs/api-inference)

---

## 📋 Maintenance Checklist

### Daily
- [ ] Monitor error logs
- [ ] Check API health
- [ ] Review new applications

### Weekly
- [ ] Check storage usage
- [ ] Review cost trends
- [ ] Test backup restoration

### Monthly
- [ ] Update dependencies
- [ ] Performance analysis
- [ ] Security audit
- [ ] Backup verification

---

## 🚨 Emergency Procedures

### If Verification Service Down
1. Check Supabase status
2. Check Edge Function logs
3. Restart function: `supabase functions deploy verify-kyc`
4. Check Hugging Face API status

### If Database Down
1. Check Supabase dashboard
2. Wait for automatic recovery
3. Contact Supabase support if needed

### If Storage Down
1. Check Supabase Storage status
2. Verify bucket still exists
3. Try redeploying functions

---

## 🎯 Next Steps

1. **Setup**: Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Deploy**: Run migrations and functions
3. **Test**: Complete testing checklist
4. **Launch**: Go to production
5. **Monitor**: Watch logs and metrics
6. **Optimize**: Improve based on feedback

---

## 📞 Getting Help

**Setup Questions?**
→ Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**System Questions?**
→ Check [KYC_SYSTEM_DOCUMENTATION.md](./KYC_SYSTEM_DOCUMENTATION.md)

**AI Provider Questions?**
→ Check [AI_PROVIDERS_GUIDE.md](./AI_PROVIDERS_GUIDE.md)

**General Questions?**
→ Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: November 17, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
