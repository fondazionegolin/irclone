import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import Chat from './components/Chat';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [user, setUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Controlla se c'è una sessione salvata
    const savedUser = localStorage.getItem('ircUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Riconnetti automaticamente
        socket.emit('login', { username: userData.username, role: userData.role });
      } catch (error) {
        console.error('Errore nel caricamento della sessione:', error);
        localStorage.removeItem('ircUser');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Gestione connessione
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connesso al server');
      
      // Se c'è un utente salvato, riconnetti automaticamente
      const savedUser = localStorage.getItem('ircUser');
      if (savedUser && !user) {
        try {
          const userData = JSON.parse(savedUser);
          socket.emit('login', { username: userData.username, role: userData.role });
        } catch (error) {
          console.error('Errore nel riconnetti:', error);
          localStorage.removeItem('ircUser');
        }
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnesso dal server');
    });

    // Gestione login
    socket.on('loginSuccess', (userData) => {
      setUser(userData);
      // Salva la sessione
      localStorage.setItem('ircUser', JSON.stringify(userData));
      
      // Se era una riconnessione automatica, emetti l'evento
      const savedUser = localStorage.getItem('ircUser');
      if (savedUser) {
        socket.emit('reconnected');
      }
    });

    // Gestione errore login (utente già connesso o errore)
    socket.on('loginError', (error) => {
      console.error('Errore login:', error);
      localStorage.removeItem('ircUser');
      setUser(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('loginSuccess');
      socket.off('loginError');
    };
  }, [user]);

  const handleLogin = (username, role) => {
    socket.emit('login', { username, role });
  };

  const handleLogout = () => {
    // Pulisci tutti i dati salvati per questo utente
    if (user) {
      localStorage.removeItem(`ircSelectedUser_${user.username}`);
      localStorage.removeItem(`ircActiveTab_${user.username}`);
      localStorage.removeItem(`ircBotSession_${user.username}`);
    }
    
    setUser(null);
    // Rimuovi la sessione salvata
    localStorage.removeItem('ircUser');
    socket.disconnect();
    socket.connect();
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="connection-status">
          <div className="spinner"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="app">
        <div className="connection-status">
          <div className="spinner"></div>
          <p>Connessione al server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat 
          user={user} 
          socket={socket} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App; 