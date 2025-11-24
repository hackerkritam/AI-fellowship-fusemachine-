# Alternative AI Providers & API Integration Guide

This guide shows how to replace or enhance the Hugging Face implementation with other AI providers.

## Current Implementation

The system currently uses **Hugging Face API** for:
- OCR (Text extraction from documents)
- Face Matching (Comparing document photos)
- Liveness Detection (Placeholder - needs proper implementation)

## Alternative Providers

### 1. AWS Rekognition (Recommended for Production)

**Pros**: Industry-leading, most reliable, best for face recognition
**Cons**: More expensive, complex setup

#### Setup
```bash
npm install aws-sdk
```

#### Update verify-kyc function:

```typescript
import { RekognitionClient, DetectFacesCommand } from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({ region: "us-east-1" });

// Face Matching
async function performFaceMatching(image1Bytes: Buffer, image2Bytes: Buffer): Promise<number> {
  const command = new CompareFacesCommand({
    SourceImage: { Bytes: image1Bytes },
    TargetImage: { Bytes: image2Bytes },
    SimilarityThreshold: 80,
  });

  const response = await rekognition.send(command);
  
  if (response.FaceMatches && response.FaceMatches.length > 0) {
    return response.FaceMatches[0].Similarity || 0;
  }
  return 0;
}

// Liveness Detection
async function performLivenessDetection(videoUrl: string): Promise<number> {
  const command = new DetectLivenessByVideoCommand({
    Video: {
      S3Object: {
        Bucket: "kyc-documents",
        Name: videoUrl,
      },
    },
  });

  const response = await rekognition.send(command);
  
  if (response.LivenessScore) {
    return response.LivenessScore;
  }
  return 0;
}
```

#### Environment Variables
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

---

### 2. Google Cloud Vision API

**Pros**: Good for OCR, integrated services, reasonable pricing
**Cons**: Requires Google Cloud setup

#### Setup
```bash
npm install @google-cloud/vision
```

#### Update verify-kyc function:

```typescript
import vision from "@google-cloud/vision";

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: "path/to/service-account-key.json",
});

// OCR Extraction
async function extractOCRData(imageBuffer: Buffer): Promise<string> {
  const request = {
    image: {
      content: imageBuffer.toString("base64"),
    },
  };

  const [result] = await visionClient.textDetection(request);
  const detections = result.textAnnotations;
  
  if (detections && detections.length > 0) {
    return detections[0].description || "";
  }
  return "";
}

// Face Detection
async function performFaceMatching(
  imagePath1: string,
  imagePath2: string
): Promise<number> {
  const request1 = {
    image: { source: { imageUri: imagePath1 } },
  };

  const request2 = {
    image: { source: { imageUri: imagePath2 } },
  };

  const [result1] = await visionClient.faceDetection(request1);
  const [result2] = await visionClient.faceDetection(request2);

  const faces1 = result1.faceAnnotations || [];
  const faces2 = result2.faceAnnotations || [];

  if (faces1.length > 0 && faces2.length > 0) {
    // Simple comparison based on face confidence
    const confidence1 = faces1[0].detectionConfidence || 0;
    const confidence2 = faces2[0].detectionConfidence || 0;
    
    return Math.min(confidence1, confidence2) * 100;
  }
  return 0;
}
```

#### Configuration
- Create Google Cloud project
- Enable Vision API
- Create service account key
- Download JSON key file

---

### 3. Microsoft Azure Face API

**Pros**: Good for face recognition, easy integration
**Cons**: Moderate pricing, rate limits

#### Setup
```bash
npm install @azure/cognitiveservices-face
```

#### Implementation:

```typescript
import { FaceClient } from "@azure/cognitiveservices-face";
import { CognitiveServicesCredentials } from "@azure/ms-rest-azure-js";

const credentials = new CognitiveServicesCredentials(process.env.AZURE_FACE_KEY);
const client = new FaceClient(credentials, process.env.AZURE_FACE_ENDPOINT);

// Face Comparison
async function performFaceMatching(
  imageUrl1: string,
  imageUrl2: string
): Promise<number> {
  // Detect faces
  const faces1 = await client.face.detectWithUrl(imageUrl1, {
    returnFaceAttributes: ["age"],
  });

  const faces2 = await client.face.detectWithUrl(imageUrl2, {
    returnFaceAttributes: ["age"],
  });

  if (faces1.length > 0 && faces2.length > 0) {
    // Verify faces
    const result = await client.face.verifyFaceToFace({
      faceId1: faces1[0].faceId,
      faceId2: faces2[0].faceId,
    });

    return (result.confidence || 0) * 100;
  }
  return 0;
}

// Liveness Detection (via Liveness API)
async function performLivenessDetection(videoUrl: string): Promise<number> {
  // Azure Liveness detection for video verification
  const result = await client.face.detectWithUrl(videoUrl);
  
  if (result.length > 0 && result[0].faceAttributes) {
    // Return confidence score
    return 85; // Placeholder
  }
  return 0;
}
```

#### Configuration
```env
AZURE_FACE_KEY=your_key
AZURE_FACE_ENDPOINT=https://[region].face.cognitive.microsoft.com/
```

---

### 4. IDology (Specialized for KYC)

**Pros**: Purpose-built for KYC verification, high accuracy
**Cons**: Most expensive, less flexible

#### Setup
```bash
npm install axios
```

#### Implementation:

```typescript
import axios from "axios";

const idologyClient = axios.create({
  baseURL: "https://api.idology.com/api",
  auth: {
    username: process.env.IDOLOGY_USERNAME,
    password: process.env.IDOLOGY_PASSWORD,
  },
});

// Document Verification
async function verifyDocument(documentImageUrl: string): Promise<{
  score: number;
  documentType: string;
  isValid: boolean;
}> {
  const response = await idologyClient.post("/documentVerification", {
    documentImage: documentImageUrl,
    returnRawImage: false,
  });

  return {
    score: response.data.results[0].confidence,
    documentType: response.data.results[0].documentType,
    isValid: response.data.results[0].isValid,
  };
}

// Liveness Verification
async function performLivenessDetection(videoUrl: string): Promise<number> {
  const response = await idologyClient.post("/livenessVerification", {
    video: videoUrl,
    documentImage: documentImageUrl,
  });

  return response.data.results[0].livenessScore * 100;
}
```

#### Configuration
```env
IDOLOGY_USERNAME=your_username
IDOLOGY_PASSWORD=your_password
```

---

## Hybrid Approach (Recommended)

Use multiple providers for best results:

```typescript
// Use Google Vision for OCR (best accuracy)
const ocrResult = await googleVisionOCR(documentImage);

// Use AWS Rekognition for face matching (most reliable)
const faceMatch = await awsRekognitionFaceMatch(image1, image2);

// Use Azure Liveness for video (good at detecting spoofing)
const livenessScore = await azureLivenessDetection(videoBuffer);

// Fallback to Hugging Face if primary fails
if (!faceMatch) {
  const fallbackScore = await huggingFaceFaceMatch(imageUrl1, imageUrl2);
}
```

---

## Cost Comparison (per 1000 verifications)

| Provider | OCR | Face Match | Liveness | Total | Notes |
|----------|-----|-----------|----------|-------|-------|
| Hugging Face | Free* | Free* | Free* | $0 | Rate limited, basic |
| Google Vision | $1.50 | $1.00 | N/A | $2.50 | No liveness |
| AWS Rekognition | $0.01 | $0.12 | $1.00 | $1.13 | Most expensive but best |
| Azure Face | $1.00 | $1.00 | Included | $2.00 | Good all-rounder |
| IDology | $2.00 | $2.00 | $2.00 | $6.00 | Most expensive, best for KYC |

*Hugging Face free tier: 30,000 API calls/month

---

## Implementation Strategy

### Phase 1: Current (Hugging Face)
- Fast development
- No costs initially
- Good for MVP/testing

### Phase 2: Add Fallbacks
- Add AWS Rekognition as fallback
- Keep Hugging Face as primary
- Better reliability

### Phase 3: Production (Hybrid)
- Google Vision for OCR
- AWS Rekognition for face matching
- Azure for liveness detection
- Hugging Face as fallback

### Phase 4: Advanced
- Add IDology for document verification
- Implement weighted scoring
- Add fraud detection
- Machine learning model for better decisions

---

## Configuration Template

Create `ai-providers.config.ts`:

```typescript
export const AI_PROVIDERS = {
  primary: {
    ocr: "google-vision",
    faceMatching: "aws-rekognition",
    livenessDetection: "azure-face",
  },
  fallback: {
    ocr: "hugging-face",
    faceMatching: "hugging-face",
    livenessDetection: "hugging-face",
  },
  thresholds: {
    faceMatchScore: 80,
    livenessScore: 80,
    rejectionThreshold: 60,
  },
};

// Usage in verify-kyc function
if (AI_PROVIDERS.primary.faceMatching === "aws-rekognition") {
  faceMatchScore = await awsRekognitionFaceMatch(...);
} else if (AI_PROVIDERS.primary.faceMatching === "google-vision") {
  faceMatchScore = await googleFaceMatch(...);
}
```

---

## Monitoring & Logging

```typescript
// Log API calls for cost tracking and debugging
interface APILog {
  provider: string;
  service: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  score: number;
}

async function logAPICall(log: APILog) {
  await supabase.from("api_logs").insert({
    provider: log.provider,
    service: log.service,
    timestamp: log.timestamp,
    duration_ms: log.duration,
    success: log.success,
    score: log.score,
  });
}

// Usage
const startTime = Date.now();
try {
  const result = await awsRekognitionFaceMatch(...);
  logAPICall({
    provider: "aws-rekognition",
    service: "face-matching",
    timestamp: new Date(),
    duration: Date.now() - startTime,
    success: true,
    score: result,
  });
} catch (error) {
  logAPICall({
    provider: "aws-rekognition",
    service: "face-matching",
    timestamp: new Date(),
    duration: Date.now() - startTime,
    success: false,
    score: 0,
  });
}
```

---

## Migration Guide

To switch from Hugging Face to AWS Rekognition:

1. **Update Environment Variables**
   ```env
   # Remove
   # HUGGINGFACE_API_KEY=...
   
   # Add
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```

2. **Update Dependencies**
   ```bash
   npm install aws-sdk
   npm uninstall hugging-face-api  # if separate package
   ```

3. **Update verify-kyc/index.ts**
   - Replace Hugging Face imports
   - Replace function implementations
   - Update error handling

4. **Test Thoroughly**
   - Test with sample documents
   - Verify accuracy
   - Check response times

5. **Deploy**
   ```bash
   supabase secrets set AWS_ACCESS_KEY_ID=...
   supabase secrets set AWS_SECRET_ACCESS_KEY=...
   supabase functions deploy verify-kyc
   ```

---

## Recommendations by Use Case

### MVP/Startup
- **Use**: Hugging Face
- **Why**: Free, fast to implement, good enough for testing
- **Cost**: $0-50/month

### Growing Business
- **Use**: Google Vision (OCR) + AWS Rekognition (Face/Liveness)
- **Why**: Good balance of cost and accuracy
- **Cost**: $500-2000/month (depending on volume)

### Regulated/Financial
- **Use**: IDology + AWS Rekognition + Azure Face API
- **Why**: Compliance-ready, highest accuracy, audit trails
- **Cost**: $2000-10000+/month (depending on volume)

### High-Volume (10k+ verifications/day)
- **Use**: Custom ML model + hybrid providers
- **Why**: Cost optimization through model routing
- **Cost**: Variable based on routing decisions

---

For more information, see the main [KYC_SYSTEM_DOCUMENTATION.md](./KYC_SYSTEM_DOCUMENTATION.md)
