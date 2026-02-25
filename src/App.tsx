import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ExaminerPanel from './components/ExaminerPanel';
import StudentPanel from './components/StudentPanel';

import { FileText, User, Home as HomeIcon } from 'lucide-react';

function Home() {
  return (
    <div className="text-center">
      <h1 className="font-display text-5xl font-bold tracking-tight text-slate-900">Examination Platform</h1>
      <p className="mt-3 text-lg text-slate-600">Please select your role to begin.</p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link to="/examiner" className="group block p-8 bg-white rounded-2xl shadow-sm border border-transparent hover:border-indigo-500 hover:shadow-lg transition-all duration-300">
          <FileText className="h-10 w-10 text-indigo-500 mx-auto" />
          <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">Examiner</h3>
          <p className="mt-1 text-slate-500">Upload and manage exams.</p>
        </Link>
        <Link to="/student" className="group block p-8 bg-white rounded-2xl shadow-sm border border-transparent hover:border-teal-500 hover:shadow-lg transition-all duration-300">
          <User className="h-10 w-10 text-teal-500 mx-auto" />
          <h3 className="mt-4 font-display text-2xl font-bold text-slate-900">Student</h3>
          <p className="mt-1 text-slate-500">Take your scheduled exam.</p>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white shadow-lg rounded-2xl p-6 sm:p-8 max-w-4xl w-full">
          <nav className="mb-6 pb-4 border-b border-slate-200">
            <ul className="flex justify-center items-center space-x-6 text-sm font-medium text-slate-500">
              <li><Link to="/" className="flex items-center gap-2 hover:text-indigo-600 transition-colors"><HomeIcon size={16}/>Home</Link></li>
              <li><Link to="/examiner" className="flex items-center gap-2 hover:text-indigo-600 transition-colors"><FileText size={16}/>Examiner Panel</Link></li>
              <li><Link to="/student" className="flex items-center gap-2 hover:text-indigo-600 transition-colors"><User size={16}/>Student Panel</Link></li>
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/examiner" element={<ExaminerPanel />} />
            <Route path="/student" element={<StudentPanel />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
