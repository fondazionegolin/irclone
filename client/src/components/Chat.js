import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, MessageSquare, Bot, Download } from 'lucide-react';
import ChannelChat from './ChannelChat';
import UserList from './UserList';
import PrivateChat from './PrivateChat';
import BotChat from './BotChat';
import PollResults from './PollResults';
import './Chat.css';

const Chat = ({ user, socket, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [botSession, setBotSession] = useState(null);
  const [activeTab, setActiveTab] = useState('channel');
  const [showUserList, setShowUserList] = useState(false);
  const [pollResults, setPollResults] = useState([]);
  const [showReconnectMessage, setShowReconnectMessage] = useState(false);
  const [newPollResults, setNewPollResults] = useState(0);
  const [showPollNotification, setShowPollNotification] = useState(false);
  const [lastPollResult, setLastPollResult] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carica dati salvati al mount
  useEffect(() => {
    const savedSelectedUser = localStorage.getItem(`ircSelectedUser_${user.username}`);
    const savedActiveTab = localStorage.getItem(`ircActiveTab_${user.username}`);
    const savedBotSession = localStorage.getItem(`ircBotSession_${user.username}`);
    
    if (savedSelectedUser) {
      setSelectedUser(savedSelectedUser);
    }
    
    if (savedActiveTab) {
      setActiveTab(savedActiveTab);
    }
    
    if (savedBotSession) {
      try {
        setBotSession(JSON.parse(savedBotSession));
      } catch (error) {
        console.error('Errore nel caricamento della sessione bot:', error);
        localStorage.removeItem(`ircBotSession_${user.username}`);
      }
    }

    // Richiedi permesso per le notifiche se è un docente
    if (user.role === 'teacher' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user.username, user.role]);

  // Salva dati quando cambiano
  useEffect(() => {
    localStorage.setItem(`ircSelectedUser_${user.username}`, selectedUser || '');
    localStorage.setItem(`ircActiveTab_${user.username}`, activeTab);
    
    if (botSession) {
      localStorage.setItem(`ircBotSession_${user.username}`, JSON.stringify(botSession));
    } else {
      localStorage.removeItem(`ircBotSession_${user.username}`);
    }
  }, [botSession, user.username, selectedUser, activeTab]);

  // Reset contatore nuovi risultati quando si va nel tab risultati
  useEffect(() => {
    if (activeTab === 'poll-results') {
      setNewPollResults(0);
    }
  }, [activeTab]);

  useEffect(() => {
    // Gestione messaggi del canale
    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('channelMessages', (messages) => {
      setMessages(messages);
    });

    // Gestione lista utenti
    socket.on('userList', (userList) => {
      setUsers(userList);
    });

    socket.on('userJoined', (data) => {
      console.log(`${data.username} è entrato nella chat`);
    });

    socket.on('userLeft', (data) => {
      console.log(`${data.username} ha lasciato la chat`);
    });

    // Gestione messaggi privati
    socket.on('privateMessage', (message) => {
      setPrivateMessages(prev => [...prev, message]);
    });

    socket.on('privateMessages', (messages) => {
      setPrivateMessages(messages);
    });

    // Gestione bot
    socket.on('botActivated', (data) => {
      setBotSession(data);
      setActiveTab('bot');
    });

    socket.on('botResponse', (message) => {
      setPrivateMessages(prev => [...prev, message]);
    });

    socket.on('botLimitReached', (data) => {
      console.log('Limite bot raggiunto:', data.message);
    });

    socket.on('activatePoll', (data) => {
      console.log('Sondaggio attivato:', data.message);
    });

    socket.on('pollCompleted', (result) => {
      setPollResults(prev => [...prev, result]);
      
      // Notifica il docente se è online
      if (user.role === 'teacher') {
        // Incrementa contatore nuovi risultati
        setNewPollResults(prev => prev + 1);
        
        // Mostra notifica temporanea
        setLastPollResult(result);
        setShowPollNotification(true);
        setTimeout(() => setShowPollNotification(false), 5000);
        
        // Mostra notifica browser
        if (Notification.permission === 'granted') {
          new Notification('Nuovo Risultato Sondaggio', {
            body: `${result.student} ha completato il sondaggio`
          });
        }
        
        // Se non è nel tab risultati, mostra un indicatore
        if (activeTab !== 'poll-results') {
          // Il contatore nel tab mostrerà il nuovo numero
          console.log('Nuovo risultato sondaggio ricevuto:', result);
        }
      }
    });

    // Gestione chat privata iniziata
    socket.on('privateChatStarted', (data) => {
      if (user.role === 'student' && data.student === user.username) {
        setSelectedUser(data.teacher);
        setActiveTab('private');
        socket.emit('getPrivateMessages', data.teacher);
      }
    });

    // Gestione riconnessione
    socket.on('reconnected', () => {
      setShowReconnectMessage(true);
      setTimeout(() => setShowReconnectMessage(false), 3000);
    });

    // Richiedi dati iniziali
    socket.emit('getUsers');
    socket.emit('getChannelMessages', 'general');

    return () => {
      socket.off('newMessage');
      socket.off('channelMessages');
      socket.off('userList');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('privateMessage');
      socket.off('privateMessages');
      socket.off('botActivated');
      socket.off('botResponse');
      socket.off('botLimitReached');
      socket.off('activatePoll');
      socket.off('pollCompleted');
      socket.off('privateChatStarted');
      socket.off('reconnected');
    };
  }, [socket]);

  const handleChannelMessage = (content) => {
    socket.emit('channelMessage', { content });
  };

  const handlePrivateMessage = (content) => {
    if (!selectedUser) return;
    socket.emit('privateMessage', { recipient: selectedUser, content });
  };

  const handleBotMessage = (content) => {
    if (!botSession) return;
    socket.emit('botMessage', { content, sessionId: botSession.sessionId });
  };

  const handleUserSelect = (username) => {
    setSelectedUser(username);
    setActiveTab('private');
    socket.emit('getPrivateMessages', username);
  };

  const handleActivateBot = (studentUsername, isBotMode) => {
    socket.emit('activateBot', { studentUsername, isBotMode });
  };

  const handleExportPoll = async () => {
    try {
      const response = await fetch('/api/export-poll');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'poll_results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Errore nell\'esportazione:', error);
    }
  };

  const getActiveTabContent = () => {
    switch (activeTab) {
      case 'channel':
        return (
          <ChannelChat
            messages={messages}
            onSendMessage={handleChannelMessage}
            user={user}
          />
        );
      case 'private':
        return (
          <PrivateChat
            messages={privateMessages}
            onSendMessage={handlePrivateMessage}
            selectedUser={selectedUser}
            user={user}
          />
        );
      case 'bot':
        return (
          <BotChat
            messages={privateMessages}
            onSendMessage={handleBotMessage}
            botSession={botSession}
            user={user}
            socket={socket}
          />
        );
      case 'poll-results':
        return (
          <PollResults
            pollResults={pollResults}
            onExport={handleExportPoll}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="user-info">
          <span className="username">{user.username}</span>
          <span className={`role-badge ${user.role}`}>
            {user.role === 'teacher' ? 'Docente' : 'Studente'}
          </span>
        </div>
        
        <div className="header-actions">
          {user.role === 'teacher' && pollResults.length > 0 && (
            <button 
              className="export-button"
              onClick={handleExportPoll}
              title="Esporta risultati sondaggio"
            >
              <Download size={16} />
              Esporta CSV
            </button>
          )}
          
          <button 
            className="user-list-toggle"
            onClick={() => setShowUserList(!showUserList)}
            title="Lista utenti"
          >
            <Users size={20} />
          </button>
          
          <button 
            className="logout-button"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Messaggio di riconnessione */}
      {showReconnectMessage && (
        <div className="reconnect-message">
          <span>✅ Riconnesso automaticamente</span>
        </div>
      )}

      {/* Notifica nuovo risultato sondaggio */}
      {showPollNotification && lastPollResult && user.role === 'teacher' && (
        <div className="poll-notification">
          <span>🎯 Nuovo risultato: {lastPollResult.student} ha risposto "{lastPollResult.answer === 'human' ? 'Umano' : 'Bot'}"</span>
        </div>
      )}

      <div className="chat-main">
        {/* Sidebar con lista utenti */}
        {showUserList && (
          <div className="chat-sidebar">
            <UserList
              users={users}
              currentUser={user}
              onUserSelect={handleUserSelect}
              onActivateBot={handleActivateBot}
            />
          </div>
        )}

        {/* Area chat principale */}
        <div className="chat-content">
          {/* Tabs */}
          <div className="chat-tabs">
            <button
              className={`tab ${activeTab === 'channel' ? 'active' : ''}`}
              onClick={() => setActiveTab('channel')}
            >
              <MessageSquare size={16} />
              Canale Generale
            </button>
            
            {(user.role === 'teacher' || selectedUser) && (
              <button
                className={`tab ${activeTab === 'private' ? 'active' : ''}`}
                onClick={() => setActiveTab('private')}
                disabled={!selectedUser}
              >
                <MessageSquare size={16} />
                Chat Privata
                {selectedUser && <span className="tab-user">({selectedUser})</span>}
              </button>
            )}
            
            {user.role === 'teacher' && (
              <button
                className={`tab ${activeTab === 'poll-results' ? 'active' : ''}`}
                onClick={() => setActiveTab('poll-results')}
              >
                <Download size={16} />
                Risultati Sondaggio
                {pollResults.length > 0 && <span className="tab-count">({pollResults.length})</span>}
                {newPollResults > 0 && activeTab !== 'poll-results' && (
                  <span className="new-results-badge">{newPollResults}</span>
                )}
              </button>
            )}
            
            {botSession && (
              <button
                className={`tab ${activeTab === 'bot' ? 'active' : ''}`}
                onClick={() => setActiveTab('bot')}
              >
                <Bot size={16} />
                Bot Chat
              </button>
            )}
          </div>

          {/* Contenuto del tab attivo */}
          <div className="tab-content">
            {getActiveTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 