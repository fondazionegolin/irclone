import React, { useState } from 'react';
import { User, GraduationCap, Bot, MessageSquare, Settings } from 'lucide-react';
import './UserList.css';

const UserList = ({ users, currentUser, onUserSelect, onActivateBot }) => {
  const [showBotOptions, setShowBotOptions] = useState({});
  const students = users.filter(user => user.role === 'student' && user.username !== currentUser.username);
  const teachers = users.filter(user => user.role === 'teacher' && user.username !== currentUser.username);

  const getRoleIcon = (role) => {
    return role === 'teacher' ? <GraduationCap size={16} /> : <User size={16} />;
  };

  const handleUserClick = (username) => {
    if (currentUser.role === 'teacher') {
      onUserSelect(username);
    }
  };

  const handleBotActivation = (e, studentUsername, isBotMode) => {
    e.stopPropagation();
    onActivateBot(studentUsername, isBotMode);
    setShowBotOptions(prev => ({ ...prev, [studentUsername]: false }));
  };

  const toggleBotOptions = (e, studentUsername) => {
    e.stopPropagation();
    setShowBotOptions(prev => ({ 
      ...prev, 
      [studentUsername]: !prev[studentUsername] 
    }));
  };

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Utenti Online ({users.length})</h3>
      </div>

      <div className="user-list-content">
        {/* Docenti */}
        {teachers.length > 0 && (
          <div className="user-section">
            <h4 className="section-title">
              <GraduationCap size={16} />
              Docenti ({teachers.length})
            </h4>
            {teachers.map((user) => (
              <div
                key={user.id}
                className={`user-item ${currentUser.role === 'teacher' ? 'clickable' : ''}`}
                onClick={() => handleUserClick(user.username)}
              >
                <div className="user-info">
                  {getRoleIcon(user.role)}
                  <span className="user-name">{user.username}</span>
                  <span className="online-indicator"></span>
                </div>
                {currentUser.role === 'teacher' && (
                  <button
                    className="chat-button"
                    onClick={(e) => handleUserClick(user.username)}
                    title="Chat privata"
                  >
                    <MessageSquare size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Studenti */}
        {students.length > 0 && (
          <div className="user-section">
            <h4 className="section-title">
              <User size={16} />
              Studenti ({students.length})
            </h4>
            {students.map((user) => (
              <div
                key={user.id}
                className={`user-item ${currentUser.role === 'teacher' ? 'clickable' : ''}`}
                onClick={() => handleUserClick(user.username)}
              >
                <div className="user-info">
                  {getRoleIcon(user.role)}
                  <span className="user-name">{user.username}</span>
                  <span className="online-indicator"></span>
                </div>
                {currentUser.role === 'teacher' && (
                  <div className="user-actions">
                    <button
                      className="chat-button"
                      onClick={(e) => handleUserClick(user.username)}
                      title="Chat privata"
                    >
                      <MessageSquare size={14} />
                    </button>
                    <div className="bot-options-container">
                      <button
                        className="bot-options-button"
                        onClick={(e) => toggleBotOptions(e, user.username)}
                        title="Opzioni test Turing"
                      >
                        <Settings size={14} />
                      </button>
                      {showBotOptions[user.username] && (
                        <div className="bot-options-dropdown">
                          <button
                            className="bot-option"
                            onClick={(e) => handleBotActivation(e, user.username, false)}
                            title="Risposta manuale (test Turing)"
                          >
                            <MessageSquare size={12} />
                            Risposta Manuale
                          </button>
                          <button
                            className="bot-option"
                            onClick={(e) => handleBotActivation(e, user.username, true)}
                            title="Bot automatico (test Turing)"
                          >
                            <Bot size={12} />
                            Bot Automatico
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {users.length === 1 && (
          <div className="empty-users">
            <p>Sei l'unico utente online</p>
          </div>
        )}
      </div>

      {/* Informazioni per docenti */}
      {currentUser.role === 'teacher' && (
        <div className="teacher-info">
          <h4>Test di Turing</h4>
          <ul>
            <li>
              <MessageSquare size={12} />
              Risposta manuale - rispondi tu personalmente
            </li>
            <li>
              <Bot size={12} />
              Bot automatico - risposta AI automatica
            </li>
            <li>
              <span>🎯</span>
              Lo studente non sa quale modalità è attiva
            </li>
            <li>
              <span>📊</span>
              Esporta risultati sondaggio
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserList; 