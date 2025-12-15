import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setProfile } from '../feature/candidateSlice';
import { BASE_URL } from '../config';

export default function ResumeUpload({ onQuestionsGenerated }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      alert('Only PDF, DOCX, or TXT files are supported');
      return;
    }

    setLoading(true);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      // Upload and generate questions
      const response = await axios.post(`${BASE_URL}/api/generate-questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success && response.data.questions) {
        // Callback to parent with generated questions
        if (onQuestionsGenerated) {
          onQuestionsGenerated(response.data.questions);
        }
        alert('Questions generated successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed to generate questions: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setFileName('');
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 8px' }}>Upload Your Resume</h3>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: 12 }}>
          Upload a PDF, DOCX, or TXT file to generate personalized interview questions based on your experience
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label
          htmlFor="resume-upload"
          className="btn primary"
          style={{
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Processing...' : 'Choose File'}
        </label>
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={loading}
          style={{ display: 'none' }}
        />
        {fileName && <span style={{ color: '#94a3b8', fontSize: 12 }}>{fileName}</span>}
      </div>
    </div>
  );
}
