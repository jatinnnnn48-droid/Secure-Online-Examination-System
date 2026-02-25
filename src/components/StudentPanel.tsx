import { useState, useEffect, useRef } from 'react';
import { User, ShieldCheck, Send } from 'lucide-react';

const EXAM_DURATION = 600; // 10 minutes in seconds

export default function StudentPanel() {
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [examTerminated, setExamTerminated] = useState(false);
  const [violation, setViolation] = useState(false);

  const timerRef = useRef(null);

  const handleSubmitExam = (violationOccurred = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setViolation(violationOccurred);
    setExamTerminated(true);
    setExamStarted(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentName,
        studentId,
        answers,
        violation: violationOccurred
      }),
    }).catch(error => console.error('Error submitting exam:', error));
  };

  const handleStartExam = async () => {
    if (studentName.trim() === '' || studentId.trim() === '') {
      alert('Please enter your full name and student ID.');
      return;
    }
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      setQuestions(data);
      setExamStarted(true);
      document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Failed to start the exam. Please try again later.');
    }
  };

  useEffect(() => {
    if (examStarted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleSubmitExam();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      const handleVisibilityChange = () => {
        if (document.hidden) {
          handleSubmitExam(true);
        }
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          handleSubmitExam(true);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        clearInterval(timerRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [examStarted]);

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: selectedOption,
    }));
  };

  if (examTerminated) {
    return (
      <div className="text-center p-8">
        <ShieldCheck className={`h-16 w-16 mx-auto ${violation ? 'text-red-500' : 'text-teal-500'}`} />
        <h2 className="mt-4 font-display text-3xl font-bold">Exam Over</h2>
        {violation ? (
          <p className="mt-2 text-lg text-red-600">Your exam was terminated due to a violation.</p>
        ) : (
          <p className="mt-2 text-lg text-slate-600">Your responses have been submitted successfully.</p>
        )}
        <p className="mt-4 text-slate-500">The exam report will be sent to the examiner shortly.</p>
      </div>
    );
  }

  if (!examStarted) {
    return (
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 text-center">Student Portal</h2>
        <div className="mt-8 space-y-4 max-w-sm mx-auto">
          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-slate-700">Full Name</label>
            <input
              id="studentName"
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-slate-700">Student ID</label>
            <input
              id="studentId"
              type="text"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <button
            onClick={handleStartExam}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
          >
            <ShieldCheck className="h-5 w-5" />
            Start Secure Exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 p-1 -m-8">
      <div className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur-lg p-4 mb-4 border-b border-slate-200">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <h2 className="font-display text-xl font-bold text-slate-800">Good Luck, {studentName}!</h2>
          <div className={`text-lg font-mono font-bold text-white px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-500' : 'bg-slate-800'}`}>
            {Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}
          </div>
        </div>
      </div>
      <div className="space-y-6 max-w-5xl mx-auto px-4">
        {questions.map((q, index) => (
          <div key={q.id} className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
            <p className="font-display text-lg font-semibold text-slate-900">Question {index + 1}</p>
            <p className="mt-1 text-slate-700">{q.question}</p>
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              {['a', 'b', 'c', 'd'].map(option => (
                <label key={option} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${answers[q.id] === option ? 'bg-indigo-100 border-indigo-300' : 'bg-slate-50 hover:bg-slate-100 border-transparent'} border`}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => handleAnswerChange(q.id, option)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="ml-3 text-slate-800">{q[`option_${option}`]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 px-4 pb-4">
        <button
          onClick={() => handleSubmitExam(false)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
        >
          <Send className="h-5 w-5" />
          Submit Final Answers
        </button>
      </div>
    </div>
  );
}
