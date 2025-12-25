import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

import SupervisedLab from './pages/Supervised/SupervisedLab';

// Placeholders for now
import UnsupervisedLab from './pages/Unsupervised/UnsupervisedLab';


import { ClassroomProvider } from './lib/classroom/ClassroomContext';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';

function App() {
  return (
    <ClassroomProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="supervised" element={<SupervisedLab />} />
            <Route path="unsupervised" element={<UnsupervisedLab />} />
            <Route path="teacher" element={<TeacherDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClassroomProvider>
  );
}

export default App;
