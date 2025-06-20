import React, { useState, useRef, useEffect } from 'react';
import { Send, User, GraduationCap } from 'lucide-react';
import './PrivateChat.css';

const PrivateChat = ({ messages, onSendMessage, selectedUser, user }) => {
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
    if (!message.trim() || !selectedUser) return;

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
            placeholder={`Scrivi un messaggio privato a ${selectedUser}...`}
            rows="1"
            className="message-input"
          />
          <button
            type="submit"
            disabled={!message.trim() || !selectedUser}
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