# Hamro Nepali KYC - Automated Verification System

## Project Overview

A comprehensive Know Your Customer (KYC) verification platform with AI-powered face recognition, liveness detection, and OCR-based document verification specifically designed for Nepal.

## Features

- 🆔 **Multi-field OCR Verification**: Extracts and verifies name, citizenship number, issued date, district, and birthplace from documents
- 👤 **Face Recognition**: Real-time face matching between Aadhaar photo and video selfie
- ✨ **Liveness Detection**: Ensures the person in the video is alive and not a static photo
- 📱 **Nepal-Specific Fields**: Citizenship certificate, birthplace district, local body, ward number
- 🎥 **Video Recording**: Built-in video selfie capture with quality checks
- ⚙️ **Admin Dashboard**: Review pending applications, approve/reject with detailed feedback
- 📊 **Transparent Results**: Clear display of which fields failed and why

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun

### Installation```sh
# Step 1: Clone the repository
git clone <repository-url>

# Step 2: Navigate to the project directory
cd verify-flow-main

# Step 3: Install dependencies
npm install

# Step 4: Set up environment variables
# Create a .env file with your Supabase credentials
echo "VITE_SUPABASE_URL=<your-supabase-url>" > .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=<your-key>" >> .env

# Step 5: Start the development server
npm run dev
```

The app will be available at `http://localhost:8082` (or next available port)

## Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Hooks
- **Face Recognition**: face-api.js + TensorFlow.js
- **Backend**: Supabase (Auth, Database, Storage)

### Verification Flow

1. **Personal Info**: Collect name, citizenship details, birthplace
2. **Document Upload**: Upload Aadhaar front & back
3. **Video Recording**: Record selfie video (15-30 seconds)
4. **Verification**:
   - OCR extraction from document
   - Face detection from Aadhaar
   - Face detection from video
   - Liveness check on video
   - Multi-field comparison
5. **Results**: Show status (approved/rejected/under_review) with detailed reasons

### Approval Thresholds

| Check | Threshold |
|-------|-----------|
| OCR Field Match | ≥ 75% |
| Face Match Score | ≥ 70% |
| Liveness Score | ≥ 60% |

All three must pass for automatic approval.

## Database Schema

- **kyc_applications**: Main KYC submission records
- **audit_logs**: Track all verification events
- **user_roles**: Admin access management

## Deployment

For production deployment:

```sh
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist` folder to your hosting provider (Vercel, Netlify, AWS, etc.)

## Technologies Used

- **Vite**: Fast frontend build tool
- **TypeScript**: Type-safe development
- **React**: UI framework
- **shadcn-ui**: Accessible component library
- **Tailwind CSS**: Utility-first CSS
- **Supabase**: Backend as a Service
- **face-api.js**: Face detection & recognition
- **TensorFlow.js**: Machine learning in browser

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

