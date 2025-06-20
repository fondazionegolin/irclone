import React, { useState } from 'react';
import { Download, User, Bot, Clock, BarChart3 } from 'lucide-react';
import './PollResults.css';

const PollResults = ({ pollResults, onExport }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'human', 'bot'

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    const total = pollResults.length;
    const humanAnswers = pollResults.filter(r => r.answer === 'human').length;
    const botAnswers = pollResults.filter(r => r.answer === 'bot').length;
    
    return {
      total,
      human: humanAnswers,
      bot: botAnswers,
      humanPercentage: total > 0 ? Math.round((humanAnswers / total) * 100) : 0,
      botPercentage: total > 0 ? Math.round((botAnswers / total) * 100) : 0
    };
  };

  const stats = getStats();

  const filteredResults = pollResults.filter(result => {
    if (filter === 'all') return true;
    return result.answer === filter;
  });

  return (
    <div className="poll-results">
      {/* Header */}
      <div className="poll-results-header">
        <div className="header-info">
          <h2>Risultati Sondaggio</h2>
          <p>Risposte degli studenti: "Hai chattato con un umano o con un bot automatico?"</p>
        </div>
        <button 
          className="export-button"
          onClick={onExport}
          disabled={pollResults.length === 0}
        >
          <Download size={16} />
          Esporta CSV
        </button>
      </div>

      {/* Statistiche generali */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Risposte Totali</span>
          </div>
        </div>

        <div className="stat-card human">
          <div className="stat-icon">
            <User size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.human}</span>
            <span className="stat-label">Hanno detto "Umano"</span>
            <span className="stat-percentage">({stats.humanPercentage}%)</span>
          </div>
        </div>

        <div className="stat-card bot">
          <div className="stat-icon">
            <Bot size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.bot}</span>
            <span className="stat-label">Hanno detto "Bot"</span>
            <span className="stat-percentage">({stats.botPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tutti ({pollResults.length})
        </button>
        <button
          className={`filter-btn ${filter === 'human' ? 'active' : ''}`}
          onClick={() => setFilter('human')}
        >
          Umano ({stats.human})
        </button>
        <button
          className={`filter-btn ${filter === 'bot' ? 'active' : ''}`}
          onClick={() => setFilter('bot')}
        >
          Bot ({stats.bot})
        </button>
      </div>

      {/* Lista risultati */}
      <div className="results-list">
        {filteredResults.length === 0 ? (
          <div className="empty-results">
            <p>Nessun risultato disponibile</p>
            {filter !== 'all' && (
              <button 
                className="clear-filter-btn"
                onClick={() => setFilter('all')}
              >
                Mostra tutti i risultati
              </button>
            )}
          </div>
        ) : (
          filteredResults.map((result, index) => (
            <div key={result.id} className="result-item">
              <div className="result-header">
                <div className="student-info">
                  <User size={16} />
                  <span className="student-name">{result.student}</span>
                </div>
                <div className="result-answer">
                  <span className={`answer-badge ${result.answer}`}>
                    {result.answer === 'human' ? (
                      <>
                        <User size={14} />
                        Umano
                      </>
                    ) : (
                      <>
                        <Bot size={14} />
                        Bot
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="result-details">
                <div className="result-time">
                  <Clock size={14} />
                  <span>{formatTime(result.timestamp)}</span>
                </div>
                <div className="result-session">
                  <span>Sessione: {result.sessionId}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PollResults; 