import React, { useState } from 'react';
import { fetchWithAuth } from '../utils/api';
import { Sparkles, Trash2 } from 'lucide-react';

const JobCard = ({ job, onDelete, onUpdate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Use aiResult from the job object if it exists (from GET /jobs or previous analysis)
  const analysis = job.aiResult;

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError('');
      const jobId = job.id || job._id; 
      
      const result = await fetchWithAuth(`/ai/analyze/${jobId}`, {
        method: 'POST'
      });
      
      // Update the parent's job list so the UI refreshes instantly
      if (onUpdate && result.aiResult) {
        onUpdate(jobId, result.aiResult);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze job');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-med';
    return 'score-low';
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'applied': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' };
      case 'interviewing': return { bg: 'rgba(234, 179, 8, 0.1)', color: 'var(--score-med)' };
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' };
      case 'offer': return { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--score-high)' };
      default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-main)' };
    }
  };

  const statusStyle = getStatusColor(job.status || 'applied');
  
  const hasAnalysis = analysis && analysis.score !== undefined;

  return (
    <div className="job-card">
      <div className="job-header">
        <div>
          <div className="job-company">{job.company}</div>
          <div className="job-role">{job.role}</div>
        </div>
        <div 
          className="job-status" 
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {job.status || 'Applied'}
        </div>
      </div>

      {!hasAnalysis && (
        <div className="job-actions">
          <button 
            className="btn btn-accent" 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            style={{ flex: 1 }}
          >
            {isAnalyzing ? (
              <span className="loader" style={{display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%'}}></span>
            ) : (
              <Sparkles size={16} />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Job'}
          </button>
          
          {onDelete && (
            <button 
              className="btn btn-danger" 
              onClick={() => onDelete(job.id || job._id)}
              title="Delete Job"
              style={{ padding: '0.5rem 0.75rem', flex: 'none', width: 'auto' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {hasAnalysis && onDelete && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button 
            className="btn btn-danger" 
            onClick={() => onDelete(job.id || job._id)}
            title="Delete Job"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', width: 'auto' }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginTop: '1rem', marginBottom: 0 }}>
          {error}
        </div>
      )}

      {hasAnalysis && (
        <div className="analysis-result">
          <div className="match-score">
            <div className={`score-circle ${getScoreClass(analysis.score)}`}>
              {analysis.score}%
            </div>
            <div className="score-text">Match Score</div>
          </div>
          
          {analysis.matchingSkills && analysis.matchingSkills.length > 0 && (
            <div className="analysis-section">
              <div className="analysis-section-title">Matching Skills</div>
              <div className="skills-list">
                {analysis.matchingSkills.map((skill, index) => (
                  <span key={index} className="skill-tag skill-match">{skill}</span>
                ))}
              </div>
            </div>
          )}
          
          {analysis.missingSkills && analysis.missingSkills.length > 0 && (
            <div className="analysis-section">
              <div className="analysis-section-title">Missing Skills</div>
              <div className="skills-list">
                {analysis.missingSkills.map((skill, index) => (
                  <span key={index} className="skill-tag skill-missing">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
             <div className="analysis-section">
               <div className="analysis-section-title">Suggestions</div>
               <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                 {analysis.suggestions.map((suggestion, idx) => (
                   <li key={idx} style={{ marginBottom: '0.25rem' }}>{suggestion}</li>
                 ))}
               </ul>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobCard;
