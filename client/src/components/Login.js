import React, { useState } from 'react';
import { User, GraduationCap, Bot } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !role) return;

    setIsSubmitting(true);
    onLogin(username.trim(), role);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>IRC Clone</h1>
          <p>Benvenuto nel sistema di chat per studenti e docenti</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Nome utente</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Inserisci il tuo nome"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Seleziona il tuo ruolo</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${role === 'student' ? 'selected' : ''}`}
                onClick={() => setRole('student')}
                disabled={isSubmitting}
              >
                <User size={24} />
                <span>Studente</span>
                <small>Può chattare nel canale principale</small>
              </button>

              <button
                type="button"
                className={`role-option ${role === 'teacher' ? 'selected' : ''}`}
                onClick={() => setRole('teacher')}
                disabled={isSubmitting}
              >
                <GraduationCap size={24} />
                <span>Docente</span>
                <small>Può chattare privatamente e attivare il bot</small>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={!username.trim() || !role || isSubmitting}
          >
            {isSubmitting ? 'Connessione...' : 'Entra nella chat'}
          </button>
        </form>

        <div className="login-features">
          <div className="feature">
            <Bot size={20} />
            <span>Modalità bot automatico per i docenti</span>
          </div>
          <div className="feature">
            <User size={20} />
            <span>Chat privata solo per docenti</span>
          </div>
          <div className="feature">
            <GraduationCap size={20} />
            <span>Sondaggio automatico sui risultati</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 