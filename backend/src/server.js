require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDatabase = require('./config/database');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log(`Socket client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Socket client disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, () => {
      console.log(`TaskFlow backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
