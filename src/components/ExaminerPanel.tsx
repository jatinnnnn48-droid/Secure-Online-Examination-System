import { useState, useEffect } from 'react';
import { UploadCloud, FileQuestion, FileKey } from 'lucide-react';

export default function ExaminerPanel() {
  const [questionsFile, setQuestionsFile] = useState(null);
  const [solutionsFile, setSolutionsFile] = useState(null);
  const [message, setMessage] = useState('');
  const [examTitle, setExamTitle] = useState('Online Examination');

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (fileType === 'questions') {
      setQuestionsFile(file);
    } else {
      setSolutionsFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionsFile || !solutionsFile) {
      setMessage('Please select both files.');
      return;
    }

    const formData = new FormData();
    formData.append('questions', questionsFile);
    formData.append('solutions', solutionsFile);
    formData.append('examTitle', examTitle);

    try {
      const response = await fetch('/api/upload/exam', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setMessage(result.message);
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('An unexpected error occurred.');
    }
  };

  useEffect(() => {
    fetch('/api/exam/title')
      .then(res => res.json())
      .then(data => setExamTitle(data.title || 'Online Examination'))
      .catch(() => setExamTitle('Online Examination'));
  }, []);

  return (
    <div>
      <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 text-center">{examTitle}</h2>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="examTitle" className="block text-sm font-medium text-slate-700">
            Exam Title
          </label>
          <input
            id="examTitle"
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="questions" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileQuestion className="h-5 w-5 text-slate-500" />
              Question Paper (CSV)
            </label>
            <input
              id="questions"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'questions')}
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>
          <div>
            <label htmlFor="solutions" className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <FileKey className="h-5 w-5 text-slate-500" />
              Solution Key (CSV)
            </label>
            <input
              id="solutions"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'solutions')}
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:-translate-y-0.5"
        >
          <UploadCloud className="h-5 w-5" />
          Upload Exam
        </button>
      </form>
      {message && <p className="mt-4 text-center text-sm font-medium text-slate-600 p-3 bg-slate-100 rounded-lg">{message}</p>}
    </div>
  );
}
