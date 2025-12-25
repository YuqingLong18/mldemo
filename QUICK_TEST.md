# Quick Test Guide for ML Demo MVP

This guide helps you verify the functionality of the Interactive ML Learning Website.

## 1. Prerequisites
- Node.js installed
- Webcam available

## 2. Installation & Run
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 3. Testing Steps

### Supervised Learning
1. Navigate to **Supervised Lab**.
2. **Allow Camera Access** when prompted.
3. You should see yourself in the camera feed.
4. **Collect Data**:
   - Select "Class A". Hold up an object (e.g., your hand). Click/Hold "Add Example" ~10 times.
   - Select "Class B". Hold up a different object (e.g., your phone). Click/Hold "Add Example" ~10 times.
5. **Verify**:
   - The "Live Predictions" panel should update automatically.
   - When you show your hand, "Class A" confidence should be high.
   - When you show your phone, "Class B" confidence should be high.

### Unsupervised Learning
1. Navigate to **Unsupervised Lab**.
2. **Capture Data**:
   - Click "Capture Example" multiple times (e.g., 5 times with Object A, 5 times with Object B).
   - Try to capture them in different positions.
3. **Clustering**:
   - Set "Clusters (K)" to 2.
   - Click "Run K-Means".
4. **Verify**:
   - Check the **Embedding Space** visualization.
   - Points should be grouped into 2 colors.
   - ideally, Object A points are grouped together and Object B points are grouped together.
   - Click a point to highlight it.

## 4. Troubleshooting
- **Camera not showing?** Check browser permissions.
- **Model loading stuck?** Check console logs. MobileNet downloads ~2-3MB.
- **Accuracy low?** Try capturing more varied examples for each class.
