# Image Analysis Schema Update

## Photos Collection

The `photos` collection has been extended with image analysis fields:

### New Fields

```typescript
{
  // Existing fields
  analysis_id: string;
  photo_url: string;
  storage_path: string;
  order_index: number;
  created_at: Timestamp;

  // New image analysis fields
  
  // Blur Detection
  blur_score: number;              // 0-100 (higher = sharper)
  blur_severity: string;            // 'sharp' | 'slight-blur' | 'blurry' | 'very-blurry'
  
  // Lighting Analysis
  lighting_score: number;           // 0-100 (higher = better lighting)
  lighting_brightness: number;      // 0-100 (perceived brightness)
  lighting_contrast: number;        // 0-100 (image contrast level)
  lighting_issues: string[];        // Array of lighting problems
  
  // Smile Detection
  smile_score: number;              // 0-100 (higher = more smile)
  smile_confidence: string;         // 'no-face' | 'neutral' | 'slight-smile' | 'clear-smile'
  face_detected: boolean;           // Whether a face was found
  smile_expressions: {              // Facial expression breakdown (optional)
    happy: number;                  // 0-100
    neutral: number;                // 0-100
    sad: number;                    // 0-100
    angry: number;                  // 0-100
    surprised: number;              // 0-100
  } | null;
  
  // Overall Analysis
  overall_quality_score: number;    // 0-100 (weighted combination of all metrics)
  quality_warnings: string[];       // Array of warning messages
  analyzed_at: Timestamp;           // When the analysis was performed
}
```

## Analyses Collection

The `analyses` collection has been extended with image analysis tracking:

### New Fields

```typescript
{
  // Existing fields...
  
  // New fields
  images_analyzed: boolean;         // Whether image analysis has been run
  images_analyzed_at: Timestamp;    // When image analysis completed
  processing_started_at: Timestamp; // When comprehensive analysis started
}
```

## Score Interpretation

### Blur Score
- **0-30**: Very blurry or blurry - Poor quality, recommend replacing
- **30-50**: Slight blur - Acceptable but could be improved
- **50-100**: Sharp - Good quality

### Lighting Score
- **0-30**: Poor lighting - Too dark, overexposed, or uneven
- **30-70**: Acceptable lighting - Usable but not optimal
- **70-100**: Good lighting - Well-lit and balanced

### Smile Score
- **0-30**: No smile or frown - Consider a smiling photo
- **30-60**: Slight smile - Acceptable
- **60-100**: Clear smile - Excellent

### Overall Quality Score
Weighted average:
- 35% Blur Score (image sharpness)
- 35% Lighting Score (image lighting)
- 30% Smile Score (smile presence)

## API Endpoints

### POST /api/image-analysis/:analysisId
Analyzes all images for a given analysis.

**Response:**
```json
{
  "success": true,
  "analysisId": "abc123",
  "totalPhotos": 3,
  "results": [
    {
      "photoId": "photo1",
      "photoUrl": "https://...",
      "analysis": {
        "blur": { "score": 75, "severity": "sharp", "isBlurry": false },
        "lighting": { "score": 82, "isGoodLighting": true, "issues": [], "brightness": 65, "contrast": 45 },
        "smile": { "score": 68, "hasSmile": true, "confidence": "clear-smile", "faceDetected": true },
        "overallScore": 75,
        "warnings": []
      }
    }
  ]
}
```

### GET /api/image-analysis/photo/:photoId
Gets analysis results for a specific photo.

### GET /api/image-analysis/analysis/:analysisId
Gets analysis results for all photos in an analysis.

## Usage Workflow

1. **Upload**: User uploads photos via `/api/upload`
   - Images are validated immediately (format, size, dimensions)
   - Invalid images are rejected with detailed error messages

2. **Trigger Analysis**: Call `/api/image-analysis/:analysisId`
   - Downloads each image
   - Runs blur, lighting, and smile detection
   - Stores results in Firestore

3. **Retrieve Results**: Call `/api/image-analysis/analysis/:analysisId`
   - Returns all photo analysis results
   - Includes scores, warnings, and detailed metrics

4. **Display to User**: Show scores and warnings alongside photos
   - Flag photos with low scores
   - Provide actionable feedback based on warnings
