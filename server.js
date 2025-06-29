require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, ()=>{
  logger.info(`Server running on ${PORT}`);
  console.log(`Server running on ${PORT}`);
});

process.on('SIGTERM', ()=>{
  logger.info('SIGTERM recieved, shutdown gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});
