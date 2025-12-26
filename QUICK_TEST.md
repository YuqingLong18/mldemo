# Quick Test Guide for ML Demo

This guide helps you verify the functionality of the Interactive ML Learning Website, including the **Teacher Dashboard** and **Classroom Monitoring** features.

## 1. Prerequisites
- **Node.js** (v18 or higher)
- **Webcam** available on your device
- **Two browser windows** (or one normal + one Incognito) to simulate Teacher and Student simultaneously.

## 2. Installation & Setup

You need to run **both** the backend (Socket.io) and the frontend (React/Vite).

### Step 1: Start the Backend Server
This server handles the classroom connections and real-time monitoring.

```bash
# Terminal 1
node server/index.js
```
*Expected Output:* `Classroom Server running on port 3015`

### Step 2: Start the Frontend
This runs the web application.

```bash
# Terminal 2
npm install
npm run dev
```
*Expected Output:* `Vite v7.x.x  Ready in X ms` -> `Traffic -> http://localhost:3016/` (or similar port).

## 3. Testing Walkthrough

### Scenario A: Teacher Setup
1. Open your browser to **[http://localhost:3016/teacher/dashboard](http://localhost:3016/teacher/dashboard)**.
   > **Note:** We skip the `/teacher/login` page for local testing because the Authentication Server relies on an external service. Navigating directly to the dashboard works for testing.
2. Click **"Create Class"**.
3. You should see a **Class Code** (6 characters, e.g., `ABC123`) displayed prominently.
4. Keep this window open. This is the **Teacher Station**.

### Scenario B: Student Joining
1. Open a **new browser window** (Incognito recommended to avoid cookie conflicts) or a different browser.
2. Go to **[http://localhost:3016/](http://localhost:3016/)**.
3. Enter the **Class Code** displayed on the Teacher Station.
4. Enter a **Nickname** (e.g., "Student 1").
5. Click **"Join Class"**.
6. You should be redirected to the Student Home (`/home`).

**Verification:**
- **Teacher Station:** Check the "Roster" tab. You should see "Student 1" listed with status `IDLE`.
- **Student Station:** You should see "Connected" or similar status (if visible) or simply be allowed to navigate.

### Scenario C: Supervised Learning & Monitoring
1. **Student:** Navigate to **Supervised Lab**.
   - Grant camera permissions.
   - Status should change to `COLLECTING` (or similar) on the Teacher Dashboard.
   - Collect some data (e.g., 5-10 images for "Class A").
   - Click "Train". Status on Teacher Dashboard should update to `TRAINING`.
   - Click "Predict". Status updates to `PREDICTING`.
   - *Check Teacher Dashboard:* Verify expected accuracy and sample counts are displayed in the "Monitoring" tab.

2. **Feature a Student (Teacher Control):**
   - **Teacher:** On the Roster tab, find "Student 1".
   - Click **"Feature Student"** (or the Star/Eye icon).
   - **Student:** Should see a prompt/notification (or silent transfer).
   - **Teacher:** Screen should navigate to a **read-only Supervised Lab** loaded with the Student's model and data.
   - *Verify:* You (Teacher) can now test the Student's model with your own camera feed.

### Scenario D: Unsupervised Learning
1. **Student:** Go to **Unsupervised Lab**.
2. **Student:** Capture unlabeled examples.
3. **Student:** Run Clustering (K-Means).
4. **Teacher:** Verify status updates on Dashboard (e.g., "K-Means k=3").

## 4. Troubleshooting

| Issue | Solution |
|-------|----------|
| **Cannot Connect / "Disconnected"** | Ensure `node server/index.js` is running on port 3015. Check browser console for Socket.io errors. |
| **Login Page Error** | If testing `/teacher/login`, it will fail without the Auth Server. Use `/teacher/dashboard` directly. |
| **Camera not working** | Check browser permissions. Ensure other apps (Zoom, Teams) aren't hogging the camera. |
| **Teacher doesn't see status updates** | extensive network restrictions? Local firewall? Ensure both run on localhost. |

## 5. Deployment Note
For production, update the `SOCKET_URL` in `src/lib/classroom/ClassroomContext.tsx` to point to your deployed backend domain.
