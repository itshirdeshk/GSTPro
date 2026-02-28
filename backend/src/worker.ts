/**
 * Standalone worker process entry point
 * Run: npm run worker
 */
import 'dotenv/config';
import { prisma, logger } from './config';
import { startWorkers, stopWorkers } from './jobs';

async function main() {
  logger.info('Starting GSTpro worker process...');

  // Test DB connection
  await prisma.$connect();
  logger.info('Database connected');

  // Start all workers
  await startWorkers();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down workers...`);
    await stopWorkers();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Worker startup failed:', err);
  process.exit(1);
});
