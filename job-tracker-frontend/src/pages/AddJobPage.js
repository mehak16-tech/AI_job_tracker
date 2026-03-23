import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import { Briefcase, ArrowLeft } from 'lucide-react';

const AddJobPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    description: '',
    status: 'Applied'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await fetchWithAuth('/jobs/add', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to add job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn btn-outline"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="card">
        <h1 className="dashboard-title" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={24} color="var(--primary)" />
          Add Job Application
        </h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="company">Company Name</label>
            <input
              id="company"
              name="company"
              type="text"
              className="form-input"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Google, Amazon, Startup Inc."
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="role">Role / Job Title</label>
            <input
              id="role"
              name="role"
              type="text"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
              placeholder="e.g. Senior Frontend Developer"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status">Application Status</label>
            <select
              id="status"
              name="status"
              className="form-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Applied">Applied</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="description">Job Description (optional)</label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Paste the job description here (helps with AI analysis)..."
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => navigate('/dashboard')}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
              style={{ flex: 2 }}
            >
               {isLoading ? (
                 <span className="loader" style={{display: 'inline-block', width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%'}}></span>
               ) : 'Save Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobPage;
