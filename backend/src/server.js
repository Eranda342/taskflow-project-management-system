require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDatabase = require('./config/database');
const { initSocket } = require('./socket/socketManager');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();

    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`TaskFlow backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
