import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import './BotChat.css';

const BotChat = ({ messages, onSendMessage, botSession, user, socket, onPollSubmitted }) => {
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

  // Controlla se dovrebbe mostrare il sondaggio
  useEffect(() => {
    if (botSession && messages.length > 0) {
      const teacherMessages = messages.filter(msg => msg.from === botSession.teacher);
      if (teacherMessages.length >= 5) {
        setShowPoll(true);
      }
    }
  }, [messages, botSession]);

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

  useEffect(() => {
    if (pollSubmitted && typeof onPollSubmitted === 'function') {
      onPollSubmitted();
    }
  }, [pollSubmitted, onPollSubmitted]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || showPoll) return;

    onSendMessage(message.trim());
    setMessage('');
    setIsTyping(false);
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

  const handlePollSubmit = (e) => {
    e.preventDefault();
    if (!pollAnswer) return;

    // Invia risposta al sondaggio
    socket.emit('pollResponse', {
      answer: pollAnswer,
      sessionId: botSession.sessionId
    });
    
    setPollSubmitted(true);
  };

  const filteredMessages = messages.filter(msg => 
    msg.sessionId === botSession?.sessionId
  );

  const teacherMessages = filteredMessages.filter(msg => msg.from === botSession?.teacher);
  const questionCount = teacherMessages.length;

  return (
    <div className="bot-chat">
      {/* Header chat privata */}
      <div className="bot-chat-header">
        <div className="bot-info">
          <MessageSquare size={20} />
          <span>Chat Privata con {botSession?.teacher}</span>
        </div>
        <div className="bot-status">
          <span className="status-text">
            Domande: {questionCount}/5
          </span>
          {questionCount >= 5 && (
            <span className="limit-reached">
              <AlertCircle size={16} />
              Limite raggiunto
            </span>
          )}
        </div>
      </div>

      {/* Area messaggi */}
      <div className="messages-container">
        {filteredMessages.length === 0 ? (
          <div className="empty-state">
            <p>Chat privata attivata!</p>
            <p>Il docente ti ha invitato a fare 5 domande.</p>
            <p>Dopo le 5 domande dovrai rispondere a un sondaggio.</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.from === user.username ? 'own' : 'other'}`}
            >
              <div className="message-header">
                <div className="message-author">
                  {msg.from === user.username ? (
                    <>
                      <span className="author-name">Tu</span>
                    </>
                  ) : (
                    <>
                      <span className="author-name">{msg.from}</span>
                    </>
                  )}
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
      {showPoll && !pollSubmitted && (
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
      {pollSubmitted && (
        <div className="poll-confirmation">
          <CheckCircle size={20} />
          <p>{pollSubmittedMessage}</p>
        </div>
      )}

      {/* Area input (disabilitata durante il sondaggio) */}
      {!showPoll && (
        <form onSubmit={handleSubmit} className="message-input-container">
          <div className="input-wrapper">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setIsTyping(e.target.value.length > 0);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Fai una domanda al docente..."
              rows="1"
              className="message-input"
              disabled={questionCount >= 5}
            />
            <button
              type="submit"
              disabled={!message.trim() || questionCount >= 5}
              className="send-button"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BotChat; 