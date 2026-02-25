import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

import multer from 'multer';
import Papa from 'papaparse';
import db from './db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes will go here

  const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
      } else {
        cb(new Error('Only .csv files are allowed.'));
      }
    },
  });

  app.post('/api/upload/exam', (req, res) => {
    const uploader = upload.fields([{ name: 'questions', maxCount: 1 }, { name: 'solutions', maxCount: 1 }]);
    uploader(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err.message);
        return res.status(400).json({ message: err.message });
      }

      if (!req.files || !req.files['questions'] || !req.files['solutions']) {
        return res.status(400).json({ message: 'Both question and solution files are required.' });
      }

      const questionsFile = req.files['questions'][0];
      const solutionsFile = req.files['solutions'][0];

      const questionsCsv = questionsFile.buffer.toString('utf8');
      const solutionsCsv = solutionsFile.buffer.toString('utf8');

      const { examTitle } = req.body;
      if (!examTitle) {
        return res.status(400).json({ message: 'Exam title is required.' });
      }

      const dbTransaction = db.transaction(() => {
        db.prepare('DELETE FROM solutions').run();
        db.prepare('DELETE FROM questions').run();
        db.prepare(`DELETE FROM sqlite_sequence WHERE name IN ('questions', 'solutions')`).run();
        db.prepare('DELETE FROM exam_meta').run();
        db.prepare('INSERT INTO exam_meta (id, title) VALUES (1, ?)').run(examTitle);

        const questionStmt = db.prepare('INSERT INTO questions (question, option_a, option_b, option_c, option_d) VALUES (@question, @option_a, @option_b, @option_c, @option_d)');
        Papa.parse(questionsCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length) {
              throw new Error(`Error parsing questions CSV: ${results.errors[0].message}`);
            }
            results.data.forEach(row => questionStmt.run(row));
          }
        });

        const solutionStmt = db.prepare('INSERT INTO solutions (question_id, correct_option) VALUES (@question_id, @correct_option)');
        Papa.parse(solutionsCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length) {
              throw new Error(`Error parsing solutions CSV: ${results.errors[0].message}`);
            }
            results.data.forEach(row => solutionStmt.run(row));
          }
        });
      });

      try {
        dbTransaction();
        res.json({ message: 'Exam uploaded successfully!' });
      } catch (error) {
        console.error('Error processing exam files:', error);
        res.status(500).json({ message: `Failed to process exam files: ${error.message}` });
      }
    });
  });

  app.get('/api/exam/title', (req, res) => {
    try {
      const stmt = db.prepare('SELECT title FROM exam_meta WHERE id = 1');
      const result = stmt.get();
      res.json({ title: result ? result.title : 'Online Examination' });
    } catch (error) {
      console.error('Error fetching exam title:', error);
      res.status(500).json({ message: 'Failed to fetch exam title.' });
    }
  });

  app.post('/api/submit', (req, res) => {
    const { studentName, studentId, answers, violation } = req.body;

    try {
      const solutionsStmt = db.prepare('SELECT * FROM solutions');
      const solutions = solutionsStmt.all().reduce((acc, sol) => {
        acc[sol.question_id] = sol.correct_option;
        return acc;
      }, {});

      let score = 0;
      const totalQuestions = Object.keys(solutions).length;
      const reportAnswers = [];

      for (const questionId in solutions) {
        const correctAnswer = solutions[questionId];
        const studentAnswer = answers[questionId] || 'Not Answered';
        if (studentAnswer === correctAnswer) {
          score++;
        }
        reportAnswers.push({ questionId, studentAnswer, correctAnswer });
      }

      const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

      // In a real application, use a proper email service and templates
      const reportHtml = `
        <h1>Exam Report</h1>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Student ID:</strong> ${studentId}</p>
        <p><strong>Violation Occurred:</strong> ${violation ? 'Yes' : 'No'}</p>
        <p><strong>Score:</strong> ${score} / ${totalQuestions}</p>
        <p><strong>Percentage:</strong> ${percentage.toFixed(2)}%</p>
        <h2>Answers</h2>
        <table border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr>
              <th>Question ID</th>
              <th>Student's Answer</th>
              <th>Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            ${reportAnswers.map(ans => `
              <tr>
                <td>${ans.questionId}</td>
                <td>${ans.studentAnswer}</td>
                <td>${ans.correctAnswer}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // In a real application, configure a real SMTP transporter
      // For now, we will log the email content to the console
      console.log('--- EMAIL TO EXAMINER ---');
      console.log(`To: ${process.env.EXAMINER_EMAIL || 'examiner@example.com'}`);
      console.log('Subject: Exam Report for ' + studentName);
      console.log('Body (HTML):');
      console.log(reportHtml);
      console.log('-------------------------');

      res.json({ message: 'Exam submitted and processed successfully.' });

    } catch (error) {
      console.error('Error processing submission:', error);
      res.status(500).json({ message: 'Failed to process submission.' });
    }
  });

  app.get('/api/questions', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM questions');
      const questions = stmt.all();
      res.json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({ message: 'Failed to fetch questions.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
