# Image Analysis Feature

## Overview

This feature provides automated image quality analysis for dating profile photos using local machine learning models. It detects:
- **Blur/Sharpness**: Uses Laplacian variance to measure image sharpness
- **Lighting Quality**: Analyzes brightness, contrast, and lighting issues
- **Smile Detection**: Detects faces and facial expressions using face-api.js

## Architecture

### Components

1. **Image Analysis Utility** (`src/utils/imageAnalysis.ts`)
   - Core ML and image processing functions
   - Uses Sharp, Jimp, and face-api.js libraries
   - Runs entirely in Node.js backend

2. **Image Analysis Routes** (`src/routes/imageAnalysis.ts`)
   - REST API endpoints for triggering and retrieving analysis
   - Integrates with Firestore for storing results

3. **Upload Validation** (`src/routes/upload.ts`)
   - Validates image format, size, and dimensions on upload
   - Rejects improperly formatted images immediately

4. **Face Detection Models** (`models/`)
   - Pre-trained TensorFlow.js models for facial analysis
   - Downloaded via `scripts/download-models.js`

## Setup

### 1. Install Dependencies

Already installed if you ran `npm install` in the backend directory.

### 2. Download Face Detection Models

```bash
cd backend
node scripts/download-models.js
```

This downloads the required face-api.js models to `backend/models/`.

### 3. Build the Backend

```bash
npm run build
```

### 4. Test Image Analysis (Optional)

```bash
node scripts/test-image-analysis.js <path-to-test-image>
```

Example:
```bash
node scripts/test-image-analysis.js ~/Pictures/test-portrait.jpg
```

## API Usage

### 1. Upload Profile with Photos

**POST** `/api/upload`

```bash
curl -X POST http://localhost:3001/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "userId=user123" \
  -F "bio=My bio text" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

**Response:**
```json
{
  "success": true,
  "analysisId": "abc123",
  "message": "Profile uploaded successfully"
}
```

If images are invalid:
```json
{
  "error": "Invalid image format detected",
  "invalidImages": [
    {
      "filename": "photo1.jpg",
      "index": 0,
      "reason": "Image too small. Minimum dimensions are 200x200 pixels."
    }
  ]
}
```

### 2. Analyze Images

**POST** `/api/image-analysis/:analysisId`

```bash
curl -X POST http://localhost:3001/api/image-analysis/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "analysisId": "abc123",
  "totalPhotos": 2,
  "results": [
    {
      "photoId": "photo1",
      "photoUrl": "https://storage.googleapis.com/.../photo1.jpg",
      "analysis": {
        "blur": {
          "score": 75,
          "isBlurry": false,
          "severity": "sharp"
        },
        "lighting": {
          "score": 82,
          "isGoodLighting": true,
          "issues": [],
          "brightness": 65,
          "contrast": 45
        },
        "smile": {
          "score": 68,
          "hasSmile": true,
          "confidence": "clear-smile",
          "faceDetected": true,
          "expressions": {
            "happy": 68,
            "neutral": 25,
            "sad": 3,
            "angry": 2,
            "surprised": 2
          }
        },
        "overallScore": 75,
        "warnings": []
      }
    }
  ]
}
```

### 3. Get Analysis Results

**GET** `/api/image-analysis/analysis/:analysisId`

Returns analysis results for all photos in an analysis.

**GET** `/api/image-analysis/photo/:photoId`

Returns analysis results for a specific photo.

## Score Interpretation

### Blur Score (0-100)
- **0-30**: Very blurry or blurry - **Poor quality**
  - Recommend: "Use a sharper photo"
- **30-50**: Slight blur - **Acceptable**
  - Recommend: "Could be sharper for better quality"
- **50-100**: Sharp - **Good quality**
  - ✅ No action needed

### Lighting Score (0-100)
- **0-30**: Poor lighting - **Needs improvement**
  - Issues: Too dark, overexposed, low contrast
  - Recommend: "Use better lighting" or specific issue
- **30-70**: Acceptable lighting - **Usable**
  - Recommend: "Lighting could be improved"
- **70-100**: Good lighting - **Excellent**
  - ✅ No action needed

### Smile Score (0-100)
- **0-30**: No smile or frown - **Consider changing**
  - Recommend: "Profiles with smiling photos tend to perform better"
- **30-60**: Slight smile - **Acceptable**
  - ✅ Minimal recommendation
- **60-100**: Clear smile - **Excellent**
  - ✅ No action needed

### Overall Quality Score
Weighted average:
- 35% Blur Score
- 35% Lighting Score
- 30% Smile Score

## Frontend Integration

### Display Analysis Results

```typescript
// Fetch analysis results
const response = await fetch(`/api/image-analysis/analysis/${analysisId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

const { photos } = await response.json();

// Display each photo with its scores
photos.forEach(photo => {
  if (photo.analysis) {
    const { blur, lighting, smile, overallScore, warnings } = photo.analysis;
    
    // Show scores as progress bars or badges
    console.log(`Overall: ${overallScore}/100`);
    console.log(`Blur: ${blur.score}/100`);
    console.log(`Lighting: ${lighting.score}/100`);
    console.log(`Smile: ${smile.score}/100`);
    
    // Display warnings
    if (warnings.length > 0) {
      warnings.forEach(warning => {
        // Show warning message to user
        console.warn(warning);
      });
    }
  }
});
```

### Complete Workflow Example

```typescript
// 1. Upload profile
const formData = new FormData();
formData.append('userId', userId);
formData.append('bio', bioText);
photoFiles.forEach(file => formData.append('photos', file));

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});

const { analysisId } = await uploadResponse.json();

// 2. Trigger image analysis
await fetch(`/api/image-analysis/${analysisId}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});

// 3. Fetch results
const resultsResponse = await fetch(`/api/image-analysis/analysis/${analysisId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

const { photos } = await resultsResponse.json();

// 4. Display results with warnings
photos.forEach(photo => {
  displayPhotoWithScores(photo);
});
```

## Technical Details

### Blur Detection Algorithm

Uses **Laplacian variance** method:
1. Convert image to grayscale
2. Apply Laplacian operator (edge detection)
3. Calculate variance of the result
4. Higher variance = sharper image
5. Normalize to 0-100 scale

### Lighting Analysis Algorithm

Uses **histogram analysis**:
1. Sample pixels across the image
2. Calculate perceived brightness (ITU-R BT.709 standard)
3. Calculate standard deviation (contrast indicator)
4. Detect issues:
   - Too dark (brightness < 40%)
   - Overexposed (brightness > 85%)
   - Low contrast (< 25)
   - Very high contrast (> 80, harsh lighting)

### Smile Detection

Uses **face-api.js with TensorFlow.js**:
1. Detect faces using Tiny Face Detector
2. Extract facial landmarks (68 points)
3. Analyze facial expressions
4. Calculate smile score from expression probabilities
5. Classify confidence level

## Performance

- **Blur detection**: ~50-200ms per image
- **Lighting analysis**: ~100-300ms per image
- **Smile detection**: ~500-1500ms per image (depends on image size)
- **Total per image**: ~1-2 seconds

For a profile with 5 photos: ~5-10 seconds total processing time.

## Limitations

1. **Face Detection**: Works best with:
   - Front-facing portraits
   - Good lighting
   - Face clearly visible
   - May not detect faces in group photos or side profiles

2. **Blur Detection**: 
   - Works on overall image sharpness
   - Cannot distinguish intentional artistic blur
   - May flag photos with shallow depth of field

3. **Lighting Analysis**:
   - Based on overall brightness/contrast
   - May not detect subtle lighting issues
   - Artistic low-key or high-key photos may be flagged

## Future Enhancements

- [ ] Face position analysis (rule of thirds)
- [ ] Background quality detection
- [ ] Color harmony analysis
- [ ] Multi-face detection and counting
- [ ] Pose analysis (full body vs portrait)
- [ ] Object detection (props, animals, etc.)
- [ ] Outfit analysis
- [ ] Photo diversity scoring (variety across all photos)

## Troubleshooting

### Models not loading
```
Error: Models directory not found
```
**Solution**: Run `node scripts/download-models.js`

### Canvas/TensorFlow errors
```
Error loading face-api models
```
**Solution**: Ensure canvas is properly installed: `npm install canvas`

### Out of memory errors
```
JavaScript heap out of memory
```
**Solution**: Increase Node.js memory: `node --max-old-space-size=4096 dist/server.js`

## Resources

- [face-api.js Documentation](https://github.com/vladmandic/face-api)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Jimp Documentation](https://github.com/jimp-dev/jimp)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
