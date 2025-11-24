import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api models (loads once, cached after)
 */
export async function loadFaceModels() {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.37/model/';
    
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('[FACE] Models loaded successfully');
  } catch (error) {
    console.error('[FACE] Failed to load face models:', error);
    throw error;
  }
}

/**
 * Extract face descriptor from an image file
 */
export async function extractFaceDescriptor(file: File): Promise<Float32Array | null> {
  try {
    // Load models if not already loaded
    await loadFaceModels();

    // Convert file to canvas
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Detect face and extract descriptor
    const detections = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections || !detections.descriptor) {
      console.warn('[FACE] No face detected in image');
      return null;
    }

    console.log('[FACE] Face descriptor extracted successfully');
    return detections.descriptor;
  } catch (error) {
    console.error('[FACE] Error extracting face descriptor:', error);
    return null;
  }
}

/**
 * Extract face from a video blob/file and detect liveness
 */
export async function extractFaceFromVideo(
  videoBlob: Blob
): Promise<{ descriptor: Float32Array | null; livenessScore: number }> {
  try {
    // Load models if not already loaded
    await loadFaceModels();

    // Create video element from blob
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.width = 320;
    video.height = 240;

    return new Promise((resolve) => {
      let frameCount = 0;
      let detectionCount = 0;
      let expressionVariance = 0;
      let expressionHistory: string[] = [];
      let lastDescriptor: Float32Array | null = null;
      let descriptorVariance = 0;

      const canvas = document.createElement('canvas');
      canvas.width = video.width;
      canvas.height = video.height;
      const ctx = canvas.getContext('2d');

      const processFrame = async () => {
        if (video.ended || frameCount >= 30) {
          // Calculate liveness score based on:
          // 1. Face detected in multiple frames
          // 2. Expression changes (blinks, movements)
          // 3. Position/descriptor changes
          const detectionRatio = detectionCount / Math.max(frameCount, 1);
          const livenessScore = Math.round(
            (detectionRatio * 40) + (expressionVariance * 30) + (descriptorVariance * 30)
          );

          console.log('[FACE] Video liveness analysis:', {
            frameCount,
            detectionCount,
            detectionRatio,
            expressionVariance,
            descriptorVariance,
            livenessScore,
          });

          resolve({
            descriptor: lastDescriptor,
            livenessScore: Math.min(100, Math.max(0, livenessScore)),
          });

          URL.revokeObjectURL(video.src);
          return;
        }

        try {
          if (video.readyState >= 2) {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

            const detections = await faceapi
              .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptor()
              .withFaceExpressions();

            frameCount++;

            if (detections) {
              detectionCount++;
              lastDescriptor = detections.descriptor;

              // Check for expression changes (indicates liveness)
              const expressions = detections.expressions;
              const maxExpression = Object.entries(expressions).reduce((a, b) =>
                a[1] > b[1] ? a : b
              )[0];
              expressionHistory.push(maxExpression);

              // Calculate expression variance
              if (expressionHistory.length > 1) {
                const uniqueExpressions = new Set(expressionHistory).size;
                expressionVariance = Math.min(1, uniqueExpressions / 3);
              }

              // Check for descriptor changes (face movement)
              if (expressionHistory.length > 5 && lastDescriptor) {
                descriptorVariance = Math.min(1, detectionCount / 15);
              }
            }

            video.currentTime += 0.1; // Move to next frame
          }
        } catch (error) {
          console.warn('[FACE] Error processing frame:', error);
          video.currentTime += 0.1;
        }

        requestAnimationFrame(processFrame);
      };

      video.onplay = () => {
        video.currentTime = 0.1;
        requestAnimationFrame(processFrame);
      };

      video.play().catch((err) => {
        console.error('[FACE] Error playing video:', err);
        resolve({ descriptor: null, livenessScore: 0 });
      });
    });
  } catch (error) {
    console.error('[FACE] Error extracting face from video:', error);
    return { descriptor: null, livenessScore: 0 };
  }
}

/**
 * Compare two face descriptors and return similarity score (0-100)
 */
export function compareFaceDescriptors(desc1: Float32Array | null, desc2: Float32Array | null): number {
  if (!desc1 || !desc2) {
    console.warn('[FACE] Cannot compare: one or both descriptors are null');
    return 0;
  }

  try {
    // Use euclidean distance: lower distance = higher similarity
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - desc2[i], 2);
    }
    const distance = Math.sqrt(sum);

    // Convert distance to similarity score (0-100)
    // Distance typically ranges from 0 to ~1.5 for same person, >1.5 for different people
    const threshold = 0.6;
    const similarity = Math.max(0, 100 * (1 - distance / threshold));

    console.log('[FACE] Face comparison - Distance:', distance.toFixed(3), 'Similarity:', Math.round(similarity) + '%');
    return Math.min(100, Math.round(similarity));
  } catch (error) {
    console.error('[FACE] Error comparing descriptors:', error);
    return 0;
  }
}
