# IRC Clone - Sistema di Chat per Studenti e Docenti

Un clone di IRC molto semplice progettato per l'ambiente educativo, dove studenti e docenti possono interagire in tempo reale con funzionalità specifiche per ogni ruolo.

## 🚀 Funzionalità

### Per Tutti gli Utenti
- **Chat nel canale principale**: Tutti possono chattare nel canale generale
- **Interfaccia moderna**: Design responsive e intuitivo
- **Tempo reale**: Comunicazione istantanea tramite WebSocket

### Per i Docenti
- **Chat privata**: Possono chattare individualmente con gli studenti
- **Modalità bot automatico**: Icona robottino per attivare la chat automatica
- **Sistema di polling**: Raccolta automatica delle risposte degli studenti
- **Esportazione CSV**: Download dei risultati del sondaggio

### Per gli Studenti
- **Chat con bot**: Possono fare fino a 5 domande al bot automatico
- **Sondaggio finale**: Dopo le 5 domande devono rispondere se hanno chattato con un umano o un bot
- **Interfaccia semplificata**: Focus sulla comunicazione

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** con Express
- **Socket.IO** per comunicazione real-time
- **CSV Writer** per esportazione dati

### Frontend
- **React** con Hooks
- **Socket.IO Client** per connessione real-time
- **Lucide React** per icone
- **CSS3** con design moderno e responsive

## 📦 Installazione

### Prerequisiti
- Node.js (versione 14 o superiore)
- npm o yarn

### Passi per l'installazione

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd IRClone
   ```

2. **Installa le dipendenze del server**
   ```bash
   npm install
   ```

3. **Installa le dipendenze del client**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Avvia l'applicazione**
   ```bash
   npm run dev
   ```

   Questo comando avvierà sia il server (porta 5000) che il client (porta 3000).

## 🎯 Come Utilizzare

### Accesso
1. Apri il browser e vai su `http://localhost:3000`
2. Inserisci il tuo nome utente
3. Seleziona il tuo ruolo (Studente o Docente)
4. Clicca su "Entra nella chat"

### Per i Docenti

#### Chat Privata
1. Clicca sull'icona "Lista utenti" nell'header
2. Seleziona uno studente dalla lista
3. Clicca sull'icona chat per iniziare una conversazione privata

#### Modalità Bot Automatico
1. Nella lista utenti, trova lo studente desiderato
2. Clicca sull'icona robottino (🤖)
3. Lo studente riceverà una notifica e potrà iniziare a chattare con il bot
4. Dopo 5 domande, lo studente dovrà rispondere al sondaggio

#### Esportazione Risultati
1. Dopo che alcuni studenti hanno completato il sondaggio
2. Clicca su "Esporta CSV" nell'header
3. Il file `poll_results.csv` verrà scaricato automaticamente

### Per gli Studenti

#### Chat nel Canale
- Scrivi messaggi nel campo di input e premi Invio
- Tutti gli utenti nel canale vedranno i tuoi messaggi

#### Chat con Bot (se attivato)
1. Se un docente attiva la modalità bot, vedrai una notifica
2. Puoi fare fino a 5 domande al bot
3. Dopo la 5ª domanda, apparirà un sondaggio
4. Rispondi se pensi di aver chattato con un umano o un bot

## 📊 Struttura del CSV Esportato

Il file CSV contiene le seguenti colonne:
- **STUDENTE**: Nome dello studente
- **RISPOSTA**: "human" o "bot"
- **TIMESTAMP**: Data e ora della risposta
- **SESSIONE**: ID della sessione bot

## 🔧 Configurazione Avanzata

### Variabili d'Ambiente
Crea un file `.env` nella root del progetto:

```env
PORT=5000
NODE_ENV=development
```

### Personalizzazione Bot
Per integrare OpenAI o altri servizi di AI, modifica la funzione `botMessage` nel file `server/index.js`.

## 🚀 Deployment

### Produzione
1. **Build del client**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Avvia il server**
   ```bash
   npm start
   ```

### Docker (opzionale)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🐛 Risoluzione Problemi

### Problemi Comuni

1. **Porta già in uso**
   - Cambia la porta nel file `.env`
   - Oppure termina il processo che usa la porta

2. **Connessione WebSocket fallita**
   - Verifica che il server sia in esecuzione
   - Controlla che non ci siano firewall che bloccano la porta 5000

3. **Dipendenze mancanti**
   ```bash
   npm install
   cd client && npm install
   ```

## 📝 Licenza

Questo progetto è rilasciato sotto licenza MIT.

## 🤝 Contributi

I contributi sono benvenuti! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature
3. Committa le tue modifiche
4. Fai un push al branch
5. Apri una Pull Request

## 📞 Supporto

Per supporto o domande, apri una issue su GitHub o contatta il team di sviluppo. 