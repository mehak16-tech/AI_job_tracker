import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth, API_BASE_URL } from '../utils/api';
import JobCard from '../components/JobCard';
import { Plus, Briefcase, FileText, Upload } from 'lucide-react';

const DashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Resume State
  const [hasResume, setHasResume] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeSuccess, setResumeSuccess] = useState('');

  const checkResumeStatus = async () => {
    try {
      await fetchWithAuth('/resume');
      setHasResume(true);
    } catch {
      setHasResume(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchWithAuth('/jobs');
      setJobs(Array.isArray(data) ? data : (data.jobs || []));
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    checkResumeStatus();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingResume(true);
      setResumeError('');
      setResumeSuccess('');

      const formData = new FormData();
      formData.append('resume', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to upload resume');
      }

      setHasResume(true);
      setResumeSuccess('Master resume uploaded perfectly!');
      setTimeout(() => setResumeSuccess(''), 3000);
    } catch (err) {
      setResumeError(err.message);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await fetchWithAuth(`/jobs/${id}`, { method: 'DELETE' });
      // Update state to remove job
      setJobs(jobs.filter(job => (job.id || job._id) !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete job');
    }
  };

  const handleUpdateJob = (id, newAiResult) => {
    setJobs(jobs.map(job => 
      (job.id || job._id) === id ? { ...job, aiResult: newAiResult } : job
    ));
  };

  // Calculate Stats
  const stats = {
    total: jobs.length,
    interviewing: jobs.filter(j => j.status?.toLowerCase() === 'interviewing').length,
    rejected: jobs.filter(j => j.status?.toLowerCase() === 'rejected').length,
    offers: jobs.filter(j => j.status?.toLowerCase() === 'offer').length
  };
  
  const successRate = stats.total > 0 ? Math.round((stats.offers / stats.total) * 100) : 0;

  return (
    <div>
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="dashboard-title">Your Applications</h1>
        <Link to="/add-job" className="btn btn-primary">
          <Plus size={18} />
          <span>Add Job</span>
        </Link>
      </div>

      {!isLoading && jobs.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem'
        }}>
          <div className="card" style={{ padding: '1.5rem' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Applications Sent</div>
             <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>{stats.total}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Interviewing</div>
             <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--score-med)' }}>{stats.interviewing}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Rejected</div>
             <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--danger)' }}>{stats.rejected}</div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Success Rate (Offers)</div>
             <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--score-high)' }}>{successRate}%</div>
          </div>
        </div>
      )}

      {/* Settings / Resume Upload Section */}
      <div className="card" style={{ marginBottom: '2.5rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="var(--primary)" /> 
              Your Master Resume
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {hasResume 
                ? "Your master resume is loaded. The AI will use it exclusively to analyze all your job matches!" 
                : "Upload your base PDF resume here. It will be used securely across all your job cards."}
            </p>
          </div>
          
          <div>
            <input 
              type="file" 
              id="resume-upload" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              onChange={handleResumeUpload} 
            />
            <button 
              className="btn btn-outline" 
              disabled={isUploadingResume}
              onClick={() => document.getElementById('resume-upload').click()}
            >
              {isUploadingResume ? (
                 <span className="loader" style={{display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%'}}></span>
              ) : (
                <Upload size={16} />
              )}
              {hasResume ? 'Update Resume' : 'Upload Resume'}
            </button>
          </div>
        </div>
        
        {resumeError && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '1rem' }}>{resumeError}</div>}
        {resumeSuccess && <div style={{ color: 'var(--score-high)', fontSize: '0.875rem', marginTop: '1rem' }}>{resumeSuccess}</div>}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
          <p>Loading your jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} className="empty-icon" />
          <h2>No Jobs Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>You haven't added any job applications yet.</p>
          <Link to="/add-job" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Get Started
          </Link>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <JobCard 
              key={job.id || job._id} 
              job={job} 
              onDelete={handleDelete}
              onUpdate={handleUpdateJob}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
