# Image Analysis Debug Guide

## Potential Issues & Solutions

### 1. **Face-API Models Not Loading** ⚠️ MOST LIKELY ISSUE
**Symptoms:**
- Analysis hangs forever
- Backend logs show "Face-api could not be loaded" warning
- No error returned to frontend

**Root Causes:**
- Models directory doesn't exist at `backend/models/`
- Missing model files (`.json` and `.bin` files)
- Face-api package not compatible with Node.js version
- Canvas dependencies not installed properly

**Solutions:**
```bash
# Check if models exist
ls -la backend/models/

# Should contain:
# - tiny_face_detector_model-shard1
# - tiny_face_detector_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_expression_model-shard1
# - face_expression_model-weights_manifest.json

# If missing, download models:
cd backend
mkdir -p models
node scripts/download-models.js  # If script exists

# Or manually download from:
# https://github.com/vladmandic/face-api/tree/master/model
```

**Workaround:** The code already has fallback logic - smile detection returns default values if face-api fails, so analysis should still complete.

---

### 2. **File System Access Issues**
**Symptoms:**
- "No valid image source found" error
- Analysis fails for some photos but not others

**Root Causes:**
- `storage_path` in Firestore doesn't match actual file location
- Permissions issues reading uploaded files
- Files not saved during upload

**Solutions:**
```bash
# Check if uploads directory exists and has files
ls -la backend/uploads/profile-photos/

# Check permissions
chmod -R 755 backend/uploads/

# Verify Firestore storage_path matches actual files
# Should be: backend/uploads/profile-photos/{userId}/{filename}
```

---

### 3. **Memory Issues with Large Images**
**Symptoms:**
- Analysis works for first few photos, then hangs
- Backend crashes or becomes unresponsive
- "Out of memory" errors in logs

**Root Causes:**
- Processing multiple high-resolution images simultaneously
- Sharp/Jimp holding large buffers in memory
- No memory cleanup between analyses

**Solutions:**
- Add image size limits during upload (already exists - 5MB)
- Process photos sequentially, not in parallel (already implemented)
- Add garbage collection hints:
```javascript
if (global.gc) {
  global.gc();
}
```

---

### 4. **Firestore Query Issues**
**Symptoms:**
- "No photos found for this analysis" error
- Analysis completes but shows 0 photos

**Root Causes:**
- Missing Firestore index for `analysis_id` + `order_index` query
- Photos not saved to Firestore during upload
- Wrong collection name or field name

**Solutions:**
```bash
# Check Firestore console for:
# Collection: photos
# Fields: analysis_id, order_index, photo_url, storage_path

# Create composite index in Firestore:
# Collection: photos
# Fields: analysis_id (Ascending), order_index (Ascending)
```

---

### 5. **Network/CORS Issues**
**Symptoms:**
- "Failed to fetch" errors in frontend
- Request never completes
- CORS errors in browser console

**Root Causes:**
- Backend server not running on expected port
- CORS not configured for frontend origin
- Firewall blocking requests

**Solutions:**
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Check CORS headers in backend server.ts
# Should allow frontend origin (http://localhost:5173)

# Check environment variables
echo $VITE_API_URL  # Should be http://localhost:3001/api
```

---

### 6. **Async/Promise Handling**
**Symptoms:**
- Analysis "completes" but results not saved
- Inconsistent behavior between runs
- Some fields missing in Firestore

**Root Causes:**
- Missing `await` in async operations
- Promise rejection not caught
- Race conditions between parallel operations

**Solutions:**
- All Firestore operations use `await`
- Wrap in try-catch blocks
- Process photos sequentially (already implemented)

---

### 7. **Frontend Timeout**
**Symptoms:**
- Frontend shows "analyzing" forever
- Backend completes but frontend doesn't update
- No error shown to user

**Root Causes:**
- Frontend polling timeout (currently 10 seconds in Results.tsx)
- No error handling for long-running operations
- Analysis takes longer than expected

**Solutions:**
```typescript
// In Results.tsx, increase timeout:
setTimeout(async () => {
  await loadImageAnalysis();
  setAnalyzingImages(false);
}, 30000); // Increase from 10s to 30s

// Or use proper polling:
const pollInterval = setInterval(async () => {
  const result = await loadImageAnalysis();
  if (result.hasAnalysis) {
    clearInterval(pollInterval);
    setAnalyzingImages(false);
  }
}, 5000);
```

---

## Debugging Steps

### Step 1: Check Backend Logs
```bash
# In backend terminal, look for:
cd backend
npm run dev

# Look for these log messages:
# ✅ Models loaded successfully
# 🔍 Starting image analysis for analysis ID: xxx
# 📸 Fetching photos from Firestore...
# ✅ Found X photos to analyze
# Analyzing photo xxx...
# ✅ Analyzed photo xxx: Score XX
# 🎉 Analysis xxx completed successfully!

# Look for errors:
# ❌ No photos found for this analysis
# ❌ Image analysis error: ...
# ⚠️ Face-api could not be loaded
```

### Step 2: Check Firestore Data
1. Open Firebase Console
2. Go to Firestore Database
3. Check `analyses` collection for your analysis ID
4. Verify `status` field and timestamps
5. Check `photos` collection for matching `analysis_id`
6. Verify `storage_path` and `photo_url` fields

### Step 3: Test Individual Components
```bash
# Test blur detection only
curl -X POST http://localhost:3001/api/image-analysis/test-blur \
  -H "Content-Type: application/json" \
  -d '{"photoId": "YOUR_PHOTO_ID"}'

# Test if backend is reachable
curl http://localhost:3001/api/health
```

### Step 4: Check File System
```bash
# Verify uploads directory structure
tree backend/uploads/profile-photos/

# Should see:
# backend/uploads/profile-photos/
# └── {userId}/
#     ├── timestamp_0_filename.jpg
#     ├── timestamp_1_filename.jpg
#     └── ...
```

---

## Quick Fixes

### If Face-API is the issue:
The code already has fallback logic, so analysis should complete even without face detection. If it's hanging, the issue is likely elsewhere.

### If hanging on specific photo:
Add timeout per photo in `imageAnalysis.ts`:
```typescript
const analysisPromise = analyzeImage(imageBuffer);
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Analysis timeout')), 30000)
);

const analysis = await Promise.race([analysisPromise, timeoutPromise]);
```

### If Firestore query fails:
Make sure you have the composite index created. The error message will include a link to create it automatically.

---

## Enhanced Logging (Already Added)

The backend now logs:
- 🔍 Start of analysis with ID
- 📦 Model loading status
- 📸 Photos fetched count
- Per-photo analysis progress
- ✅ Success messages with scores
- ❌ Error messages with stack traces
- 🎉 Completion message

Check the backend terminal for these emoji-marked logs!
