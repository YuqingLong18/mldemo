import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

import SupervisedLab from './pages/Supervised/SupervisedLab';

// Placeholders for now
import UnsupervisedLab from './pages/Unsupervised/UnsupervisedLab';


import { ClassroomProvider } from './lib/classroom/ClassroomContext';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import StudentLogin from './pages/StudentLogin';
import TeacherLogin from './pages/Teacher/TeacherLogin';
import RequireTeacherAuth from './components/Teacher/RequireTeacherAuth';

function App() {
  return (
    <ClassroomProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<StudentLogin />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />

          {/* Protected/App Routes (Wrapped in Layout) */}
          <Route path="/" element={<Layout />}>
            <Route path="home" element={<Home />} />
            <Route path="supervised" element={<SupervisedLab />} />
            <Route path="unsupervised" element={<UnsupervisedLab />} />
            <Route
              path="teacher/dashboard"
              element={(
                <RequireTeacherAuth>
                  <TeacherDashboard />
                </RequireTeacherAuth>
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClassroomProvider>
  );
}

export default App;
