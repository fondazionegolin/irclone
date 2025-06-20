import React, { useState, useRef, useEffect } from 'react';
import { Send, User, GraduationCap } from 'lucide-react';
import './ChannelChat.css';

const ChannelChat = ({ messages, onSendMessage, user }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

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

  const getRoleIcon = (role) => {
    return role === 'teacher' ? <GraduationCap size={16} /> : <User size={16} />;
  };

  return (
    <div className="channel-chat">
      {/* Area messaggi */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Benvenuto nel canale generale!</p>
            <p>Inizia a chattare con gli altri utenti.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.username === user.username ? 'own' : ''}`}
            >
              <div className="message-header">
                <div className="message-author">
                  {getRoleIcon(msg.role)}
                  <span className="author-name">{msg.username}</span>
                  {msg.role === 'teacher' && (
                    <span className="teacher-badge">Docente</span>
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

      {/* Area input */}
      <form onSubmit={handleSubmit} className="message-input-container">
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Scrivi un messaggio..."
            rows="1"
            className="message-input"
          />
          <button
            type="submit"
            disabled={!message.trim()}
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

export default ChannelChat; 