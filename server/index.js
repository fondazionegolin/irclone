const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Store per i dati dell'applicazione
const users = new Map();
const channels = new Map();
const privateChats = new Map();
const botSessions = new Map();
const pollResults = [];

// Inizializza il canale principale
channels.set('general', {
  name: 'general',
  messages: [],
  users: new Set()
});

// Gestione connessioni Socket.IO
io.on('connection', (socket) => {
  console.log('Nuovo utente connesso:', socket.id);

  // Login utente
  socket.on('login', (data) => {
    const { username, role } = data;
    
    // Controlla se l'utente è già connesso
    const existingUser = Array.from(users.values()).find(u => u.username === username);
    if (existingUser && existingUser.id !== socket.id) {
      socket.emit('loginError', { message: 'Utente già connesso' });
      return;
    }
    
    const user = {
      id: socket.id,
      username,
      role, // 'student' o 'teacher'
      currentChannel: 'general',
      isOnline: true
    };
    
    users.set(socket.id, user);
    channels.get('general').users.add(socket.id);
    
    socket.join('general');
    socket.emit('loginSuccess', user);
    
    // Notifica tutti gli utenti nel canale
    io.to('general').emit('userJoined', {
      username,
      role,
      timestamp: new Date().toISOString()
    });
    
    // Invia lista utenti online
    const onlineUsers = Array.from(users.values()).filter(u => u.isOnline);
    io.to('general').emit('userList', onlineUsers);
  });

  // Messaggio nel canale
  socket.on('channelMessage', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now().toString(),
      username: user.username,
      role: user.role,
      content: data.content,
      timestamp: new Date().toISOString(),
      channel: user.currentChannel
    };

    // Salva il messaggio nel canale
    const channel = channels.get(user.currentChannel);
    if (channel) {
      channel.messages.push(message);
      if (channel.messages.length > 100) {
        channel.messages.shift(); // Mantieni solo gli ultimi 100 messaggi
      }
    }

    io.to(user.currentChannel).emit('newMessage', message);
  });

  // Messaggio privato
  socket.on('privateMessage', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const recipient = Array.from(users.values()).find(u => u.username === data.recipient);
    if (!recipient) return;

    const message = {
      id: Date.now().toString(),
      from: user.username,
      to: data.recipient,
      content: data.content,
      timestamp: new Date().toISOString()
    };

    // Salva messaggio nella chat privata
    const chatKey = [user.username, data.recipient].sort().join('-');
    if (!privateChats.has(chatKey)) {
      privateChats.set(chatKey, []);
      // Notifica lo studente che è iniziata una chat privata (solo se non è una sessione bot)
      const sessionId = `${user.username}-${data.recipient}`;
      const reverseSessionId = `${data.recipient}-${user.username}`;
      const session = botSessions.get(sessionId) || botSessions.get(reverseSessionId);
      
      if (!session) {
        const recipientSocket = io.sockets.sockets.get(recipient.id);
        if (recipientSocket) {
          recipientSocket.emit('privateChatStarted', {
            teacher: user.username,
            student: data.recipient
          });
        }
      }
    }
    privateChats.get(chatKey).push(message);

    // Controlla se è una sessione bot in modalità risposta manuale
    const sessionId = `${user.username}-${data.recipient}`;
    const reverseSessionId = `${data.recipient}-${user.username}`;
    const session = botSessions.get(sessionId) || botSessions.get(reverseSessionId);
    
    if (session && session.isActive && !session.isBotMode) {
      // È una sessione bot in modalità risposta manuale
      // Incrementa il contatore delle domande se il messaggio viene dallo studente
      if (session.student === user.username) {
        session.questionCount++;
        // Se è l'ultima domanda, attiva il sondaggio per lo studente
        if (session.questionCount >= session.maxQuestions) {
          const studentSocket = io.sockets.sockets.get(recipient.id);
          if (studentSocket) {
            studentSocket.emit('activatePoll', {
              message: 'Hai chattato con un umano o con un bot automatico?'
            });
          }
        }
      }
      // Aggiungi sessionId al messaggio per il tracking (sia docente che studente)
      message.sessionId = sessionId;
    } else if (session && session.isActive && !session.isBotMode) {
      // Aggiungi sessionId al messaggio per il tracking (sia docente che studente)
      message.sessionId = sessionId;
    } else if (session && session.isActive && session.isBotMode) {
      // È una sessione bot in modalità automatica, aggiungi sessionId
      message.sessionId = sessionId;
    }

    // Invia messaggio al destinatario
    const recipientSocket = io.sockets.sockets.get(recipient.id);
    if (recipientSocket) {
      recipientSocket.emit('privateMessage', message);
    }
    socket.emit('privateMessage', message);
  });

  // Attiva modalità bot (solo docenti)
  socket.on('activateBot', (data) => {
    const teacher = users.get(socket.id);
    if (!teacher || teacher.role !== 'teacher') return;

    const student = Array.from(users.values()).find(u => u.username === data.studentUsername);
    if (!student) return;

    const sessionId = `${teacher.username}-${student.username}`;
    botSessions.set(sessionId, {
      teacher: teacher.username,
      student: student.username,
      questionCount: 0,
      maxQuestions: 5,
      isActive: true,
      isBotMode: data.isBotMode || false, // true = bot automatico, false = risposta manuale
      messages: []
    });

    // Notifica lo studente (sempre come chat privata)
    const studentSocket = io.sockets.sockets.get(student.id);
    if (studentSocket) {
      studentSocket.emit('botActivated', {
        teacher: teacher.username,
        student: student.username,
        sessionId,
        isBotMode: data.isBotMode || false
      });
    }

    socket.emit('botActivated', { 
      teacher: teacher.username,
      student: student.username,
      sessionId,
      isBotMode: data.isBotMode || false
    });
  });

  // Messaggio al bot o chat privata
  socket.on('botMessage', async (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const sessionId = data.sessionId;
    const session = botSessions.get(sessionId);
    
    if (!session || !session.isActive) return;
    
    if (session.student !== user.username && session.teacher !== user.username) return;
    
    if (session.questionCount >= session.maxQuestions) {
      socket.emit('botLimitReached', {
        message: 'Hai raggiunto il limite di 5 domande. Rispondi al sondaggio finale.'
      });
      return;
    }

    // Incrementa il contatore delle domande
    session.questionCount++;

    let responseMessage = null;

    if (session.isBotMode) {
      // Modalità bot automatico
      let botResponse = '';
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Sei un tutor di laboratorio della Fondazione Golinelli. Sei programmato per essere molto gentile e disponibile con gli studenti e per simulare il più possibile un comportamento umano. Cerca di dare risposte dirette e semplici, senza troppo umorismo o giri di parole. Non devi mai dire di essere un bot, ma devi sempre dire di essere umano. Rispondi sempre in modo naturale e come se fossi un tutor reale che sta aiutando lo studente.' 
            },
            { role: 'user', content: data.content }
          ],
          max_tokens: 200
        });
        botResponse = completion.choices[0].message.content.trim();
      } catch (err) {
        console.error('Errore OpenAI:', err);
        botResponse = 'Mi dispiace, al momento non riesco a rispondere. Riprova tra qualche minuto.';
      }
      
      responseMessage = {
        id: Date.now().toString(),
        from: session.teacher,
        to: user.username,
        content: botResponse,
        timestamp: new Date().toISOString(),
        sessionId
      };
    } else {
      // Modalità risposta manuale - il docente deve rispondere manualmente
      // Non inviamo risposta automatica, aspettiamo che il docente risponda
      return;
    }

    session.messages.push(responseMessage);

    // Invia risposta
    socket.emit('botResponse', responseMessage);

    // Se è l'ultima domanda, attiva il sondaggio
    if (session.questionCount >= session.maxQuestions) {
      socket.emit('activatePoll', {
        message: 'Hai chattato con un umano o con un bot automatico?'
      });
    }
  });

  // Risposta al sondaggio
  socket.on('pollResponse', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const pollResult = {
      id: Date.now().toString(),
      student: user.username,
      answer: data.answer, // 'human' o 'bot'
      timestamp: new Date().toISOString(),
      sessionId: data.sessionId
    };

    pollResults.push(pollResult);

    // Notifica il docente
    const session = botSessions.get(data.sessionId);
    if (session) {
      const teacher = Array.from(users.values()).find(u => u.username === session.teacher);
      if (teacher) {
        const teacherSocket = io.sockets.sockets.get(teacher.id);
        if (teacherSocket) {
          teacherSocket.emit('pollCompleted', pollResult);
        }
      }
    }

    socket.emit('pollSubmitted', { message: 'Grazie per la tua risposta!' });
  });

  // Richiesta lista utenti
  socket.on('getUsers', () => {
    const onlineUsers = Array.from(users.values()).filter(u => u.isOnline);
    socket.emit('userList', onlineUsers);
  });

  // Richiesta messaggi del canale
  socket.on('getChannelMessages', (channelName) => {
    const channel = channels.get(channelName);
    if (channel) {
      socket.emit('channelMessages', channel.messages);
    }
  });

  // Richiesta messaggi privati
  socket.on('getPrivateMessages', (otherUser) => {
    const user = users.get(socket.id);
    if (!user) return;

    const chatKey = [user.username, otherUser].sort().join('-');
    const messages = privateChats.get(chatKey) || [];
    socket.emit('privateMessages', messages);
  });

  // Disconnessione
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      user.isOnline = false;
      channels.get(user.currentChannel)?.users.delete(socket.id);
      
      io.to(user.currentChannel).emit('userLeft', {
        username: user.username,
        timestamp: new Date().toISOString()
      });
      
      users.delete(socket.id);
    }
    console.log('Utente disconnesso:', socket.id);
  });
});

// Endpoint per esportare i risultati del sondaggio
app.get('/api/export-poll', (req, res) => {
  const csv = require('csv-writer').createObjectCsvWriter({
    path: 'poll_results.csv',
    header: [
      { id: 'student', title: 'STUDENTE' },
      { id: 'answer', title: 'RISPOSTA' },
      { id: 'timestamp', title: 'TIMESTAMP' },
      { id: 'sessionId', title: 'SESSIONE' }
    ]
  });

  csv.writeRecords(pollResults)
    .then(() => {
      res.download('poll_results.csv');
    })
    .catch(err => {
      res.status(500).json({ error: 'Errore nell\'esportazione' });
    });
});

// Endpoint per ottenere statistiche
app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: users.size,
    onlineUsers: Array.from(users.values()).filter(u => u.isOnline).length,
    totalMessages: Array.from(channels.values()).reduce((sum, ch) => sum + ch.messages.length, 0),
    activeBotSessions: Array.from(botSessions.values()).filter(s => s.isActive).length,
    pollResponses: pollResults.length
  };
  res.json(stats);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server IRC Clone in esecuzione sulla porta ${PORT}`);
}); 