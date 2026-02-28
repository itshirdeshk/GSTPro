import { Worker, Job } from 'bullmq';
import { redis, logger, prisma } from '../config';

// PDF generation worker
const pdfWorker = new Worker(
  'pdf-generation',
  async (job: Job) => {
    const { invoiceId, tenantId } = job.data;
    logger.info(`Generating PDF for invoice ${invoiceId} (tenant: ${tenantId})`);

    try {
      // Fetch invoice with all details
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: {
          items: true,
          customer: true,
          tenant: true,
        },
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      // TODO: Implement actual PDF generation with pdfkit / puppeteer
      // For now, log the intent
      logger.info(`PDF would be generated for ${invoice.invoiceNumber}`);

      // Store PDF URL in invoice
      // await prisma.invoice.update({
      //   where: { id: invoiceId },
      //   data: { pdfUrl: `/pdfs/${invoice.invoiceNumber}.pdf` },
      // });

      return { invoiceNumber: invoice.invoiceNumber, status: 'generated' };
    } catch (error) {
      logger.error(`PDF generation failed for invoice ${invoiceId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 1000,
    },
  }
);

// Email notification worker
const emailWorker = new Worker(
  'email-notifications',
  async (job: Job) => {
    const { type, to, subject, data } = job.data;
    logger.info(`Sending ${type} email to ${to}: ${subject}`);

    try {
      // TODO: Implement actual email sending with nodemailer / SendGrid / SES
      logger.info(`Email would be sent: ${type} to ${to}`);

      return { type, to, status: 'sent' };
    } catch (error) {
      logger.error(`Email sending failed to ${to}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3,
  }
);

// Report generation worker
const reportWorker = new Worker(
  'report-generation',
  async (job: Job) => {
    const { type, tenantId, params } = job.data;
    logger.info(`Generating ${type} report for tenant ${tenantId}`);

    try {
      // TODO: Implement report generation with export to CSV/PDF
      logger.info(`Report would be generated: ${type} for tenant ${tenantId}`);

      return { type, tenantId, status: 'generated' };
    } catch (error) {
      logger.error(`Report generation failed for tenant ${tenantId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1,
  }
);

// Worker event handlers
[pdfWorker, emailWorker, reportWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} in ${worker.name} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} in ${worker.name} failed:`, err.message);
  });

  worker.on('error', (err) => {
    logger.error(`Worker ${worker.name} error:`, err.message);
  });
});

export const workers = { pdfWorker, emailWorker, reportWorker };

export async function startWorkers() {
  logger.info('BullMQ workers started');
  logger.info('  - PDF generation worker');
  logger.info('  - Email notification worker');
  logger.info('  - Report generation worker');
}

export async function stopWorkers() {
  await Promise.all([
    pdfWorker.close(),
    emailWorker.close(),
    reportWorker.close(),
  ]);
  logger.info('All workers stopped');
}
