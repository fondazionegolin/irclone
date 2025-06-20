import React, { useState, useRef, useEffect } from 'react';
import { Send, User, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';
import './PrivateChat.css';

const PrivateChat = ({ messages, onSendMessage, selectedUser, user, botSession, socket }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollAnswer, setPollAnswer] = useState('');
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [pollSubmittedMessage, setPollSubmittedMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- INIZIO: LOGICA COUNTER DOMANDE ---
  let isTuringManual = false;
  let questionCount = 0;
  let maxQuestions = 5;
  if (botSession && botSession.isBotMode === false) {
    if (
      (user.role === 'student' && botSession.teacher === selectedUser) ||
      (user.role === 'teacher' && botSession.student === selectedUser)
    ) {
      isTuringManual = true;
      // Conta solo le risposte del docente
      questionCount = messages.filter(
        msg => msg.from === botSession.teacher && msg.to === botSession.student && msg.sessionId === botSession.sessionId
      ).length;
    }
  }
  // --- FINE: LOGICA COUNTER DOMANDE ---

  // Mostra il sondaggio quando raggiunte 5 domande
  useEffect(() => {
    if (isTuringManual && questionCount >= maxQuestions) {
      setShowPoll(true);
    }
  }, [isTuringManual, questionCount]);

  // Listener per conferma invio sondaggio
  useEffect(() => {
    if (socket) {
      const handlePollSubmitted = (data) => {
        setPollSubmittedMessage(data.message);
      };
      socket.on('pollSubmitted', handlePollSubmitted);
      return () => {
        socket.off('pollSubmitted', handlePollSubmitted);
      };
    }
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    // Blocca invio se superato il limite domande in modalità test Turing manuale
    if (isTuringManual && user.role === 'student' && questionCount >= maxQuestions) return;
    onSendMessage(message.trim());
    setMessage('');
    setIsTyping(false);
  };

  const handlePollSubmit = (e) => {
    e.preventDefault();
    if (!pollAnswer) return;
    socket.emit('pollResponse', {
      answer: pollAnswer,
      sessionId: botSession.sessionId
    });
    setPollSubmitted(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role) => {
    return role === 'teacher' ? <GraduationCap size={16} /> : <User size={16} />;
  };

  const filteredMessages = messages.filter(msg => 
    (msg.from === selectedUser && msg.to === user.username) ||
    (msg.from === user.username && msg.to === selectedUser)
  );

  if (!selectedUser) {
    return (
      <div className="private-chat">
        <div className="no-selection">
          <p>Seleziona un utente dalla lista per iniziare una chat privata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="private-chat">
      {/* Header chat privata */}
      <div className="private-chat-header">
        <div className="chat-partner">
          {user.role === 'teacher' ? <User size={20} /> : <GraduationCap size={20} />}
          <span>{selectedUser}</span>
          {user.role === 'student' && (
            <span className="teacher-indicator">(Docente)</span>
          )}
        </div>
        <div className="chat-status">
          <span className="status-text">Chat privata</span>
        </div>
      </div>

      {/* Contatore domande test Turing manuale */}
      {isTuringManual && (
        <div className="turing-question-counter">
          <span>Domande: {questionCount}/{maxQuestions}</span>
          {questionCount >= maxQuestions && (
            <span className="limit-reached"><AlertCircle size={16}/> Limite raggiunto</span>
          )}
        </div>
      )}

      {/* Area messaggi */}
      <div className="messages-container">
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            <p>Inizia una conversazione privata con {selectedUser}</p>
            <p>I messaggi sono visibili solo tra voi due.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.from === user.username ? 'own' : 'other'}`}
            >
              <div className="message-header">
                <div className="message-author">
                  {getRoleIcon(msg.from === user.username ? user.role : 'student')}
                  <span className="author-name">
                    {msg.from === user.username ? 'Tu' : msg.from}
                  </span>
                </div>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sondaggio finale */}
      {isTuringManual && showPoll && !pollSubmitted && (
        <div className="poll-container">
          <div className="poll-header">
            <AlertCircle size={20} />
            <h3>Sondaggio Finale</h3>
          </div>
          <p className="poll-question">
            Hai chattato con un umano o con un bot automatico?
          </p>
          <form onSubmit={handlePollSubmit} className="poll-form">
            <div className="poll-options">
              <label className="poll-option">
                <input
                  type="radio"
                  name="pollAnswer"
                  value="human"
                  checked={pollAnswer === 'human'}
                  onChange={(e) => setPollAnswer(e.target.value)}
                />
                <span>Umano</span>
              </label>
              <label className="poll-option">
                <input
                  type="radio"
                  name="pollAnswer"
                  value="bot"
                  checked={pollAnswer === 'bot'}
                  onChange={(e) => setPollAnswer(e.target.value)}
                />
                <span>Bot Automatico</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={!pollAnswer}
              className="poll-submit-button"
            >
              Invia Risposta
            </button>
          </form>
        </div>
      )}

      {/* Conferma sondaggio */}
      {isTuringManual && pollSubmitted && (
        <div className="poll-confirmation">
          <CheckCircle size={20} />
          <p>{pollSubmittedMessage}</p>
        </div>
      )}

      {/* Area input (disabilitata durante il sondaggio) */}
      <form onSubmit={handleSubmit} className="message-input-container">
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder={`Scrivi un messaggio privato a ${selectedUser}...`}
            rows="1"
            className="message-input"
            disabled={isTuringManual && user.role === 'student' && (questionCount >= maxQuestions || showPoll)}
          />
          <button
            type="submit"
            disabled={!message.trim() || !selectedUser || (isTuringManual && user.role === 'student' && (questionCount >= maxQuestions || showPoll))}
            className="send-button"
          >
            <Send size={18} />
          </button>
        </div>
        {isTyping && (
          <div className="typing-indicator">
            <span>Stai scrivendo...</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default PrivateChat; 