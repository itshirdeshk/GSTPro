import { Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { roundTo2 } from '../../utils/gst';

export class ReportService {
  /**
   * Sales Report: Revenue, invoices count, breakdowns by status, top customers, monthly trend
   */
  async salesReport(
    tenantId: string,
    fromDate: string,
    toDate: string
  ) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const baseWhere: Prisma.InvoiceWhereInput = {
      tenantId,
      invoiceDate: { gte: from, lte: to },
      status: { not: 'CANCELLED' },
    };

    const [
      totals,
      byStatus,
      topCustomers,
      monthlyTrend,
    ] = await Promise.all([
      // Total revenue, amounts
      prisma.invoice.aggregate({
        where: baseWhere,
        _sum: {
          totalAmount: true,
          amountPaid: true,
          cgst: true,
          sgst: true,
          igst: true,
          discount: true,
          subtotal: true,
        },
        _count: true,
      }),

      // Breakdown by status
      prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId, invoiceDate: { gte: from, lte: to } },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Top 10 customers by revenue
      prisma.invoice.groupBy({
        by: ['customerId'],
        where: baseWhere,
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),

      // Monthly trend using raw query
      prisma.$queryRaw<{ month: string; total: number; count: bigint }[]>`
        SELECT 
          TO_CHAR(invoice_date, 'YYYY-MM') as month,
          SUM(total_amount)::float as total,
          COUNT(*)::bigint as count
        FROM invoices 
        WHERE tenant_id = ${tenantId}::uuid
          AND invoice_date >= ${from}
          AND invoice_date <= ${to}
          AND status != 'CANCELLED'
        GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
        ORDER BY month ASC
      `,
    ]);

    // Fetch customer names for top customers
    const customerIds = topCustomers.map((c) => c.customerId);
    const customers = customerIds.length > 0
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));

    return {
      summary: {
        totalRevenue: Number(totals._sum.totalAmount || 0),
        totalCollected: Number(totals._sum.amountPaid || 0),
        totalOutstanding: roundTo2(
          Number(totals._sum.totalAmount || 0) - Number(totals._sum.amountPaid || 0)
        ),
        subtotal: Number(totals._sum.subtotal || 0),
        totalCgst: Number(totals._sum.cgst || 0),
        totalSgst: Number(totals._sum.sgst || 0),
        totalIgst: Number(totals._sum.igst || 0),
        totalDiscount: Number(totals._sum.discount || 0),
        invoiceCount: totals._count,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        total: Number(s._sum.totalAmount || 0),
        count: s._count,
      })),
      topCustomers: topCustomers.map((c) => ({
        customerId: c.customerId,
        customerName: customerMap.get(c.customerId) || 'Unknown',
        total: Number(c._sum.totalAmount || 0),
        invoiceCount: c._count,
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        month: m.month,
        total: Number(m.total || 0),
        count: Number(m.count),
      })),
    };
  }

  /**
   * GST Report: CGST/SGST/IGST breakdown, tax liability
   */
  async gstReport(
    tenantId: string,
    fromDate: string,
    toDate: string
  ) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const baseWhere: Prisma.InvoiceWhereInput = {
      tenantId,
      invoiceDate: { gte: from, lte: to },
      status: { not: 'CANCELLED' },
    };

    const [
      taxTotals,
      byGstRate,
      interVsIntra,
      monthlyGst,
      inputGst,
    ] = await Promise.all([
      // Aggregate tax totals
      prisma.invoice.aggregate({
        where: baseWhere,
        _sum: {
          subtotal: true,
          cgst: true,
          sgst: true,
          igst: true,
          totalAmount: true,
        },
        _count: true,
      }),

      // Tax by GST rate (from invoice items)
      prisma.invoiceItem.groupBy({
        by: ['gstRate'],
        where: {
          invoice: baseWhere,
        },
        _sum: {
          taxableAmount: true,
          cgst: true,
          sgst: true,
          igst: true,
          totalAmount: true,
        },
        _count: true,
        orderBy: { gstRate: 'asc' },
      }),

      // Inter-state vs Intra-state
      prisma.invoice.groupBy({
        by: ['isInterState'],
        where: baseWhere,
        _sum: { cgst: true, sgst: true, igst: true, totalAmount: true },
        _count: true,
      }),

      // Monthly GST trend
      prisma.$queryRaw<
        { month: string; cgst: number; sgst: number; igst: number }[]
      >`
        SELECT 
          TO_CHAR(invoice_date, 'YYYY-MM') as month,
          SUM(cgst)::float as cgst,
          SUM(sgst)::float as sgst,
          SUM(igst)::float as igst
        FROM invoices 
        WHERE tenant_id = ${tenantId}::uuid
          AND invoice_date >= ${from}
          AND invoice_date <= ${to}
          AND status != 'CANCELLED'
        GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
        ORDER BY month ASC
      `,

      // Input GST (from expenses)
      prisma.expense.aggregate({
        where: {
          tenantId,
          expenseDate: { gte: from, lte: to },
        },
        _sum: { gstAmount: true, amount: true },
        _count: true,
      }),
    ]);

    const outputGst = roundTo2(
      Number(taxTotals._sum.cgst || 0) +
        Number(taxTotals._sum.sgst || 0) +
        Number(taxTotals._sum.igst || 0)
    );
    const inputGstTotal = Number(inputGst._sum.gstAmount || 0);
    const netLiability = roundTo2(outputGst - inputGstTotal);

    return {
      summary: {
        taxableValue: Number(taxTotals._sum.subtotal || 0),
        cgst: Number(taxTotals._sum.cgst || 0),
        sgst: Number(taxTotals._sum.sgst || 0),
        igst: Number(taxTotals._sum.igst || 0),
        totalOutputGst: outputGst,
        totalInputGst: inputGstTotal,
        netGstLiability: netLiability,
        invoiceCount: taxTotals._count,
      },
      byGstRate: byGstRate.map((r) => ({
        gstRate: Number(r.gstRate),
        taxableAmount: Number(r._sum.taxableAmount || 0),
        cgst: Number(r._sum.cgst || 0),
        sgst: Number(r._sum.sgst || 0),
        igst: Number(r._sum.igst || 0),
        total: Number(r._sum.totalAmount || 0),
        count: r._count,
      })),
      interVsIntra: interVsIntra.map((t) => ({
        type: t.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)',
        cgst: Number(t._sum.cgst || 0),
        sgst: Number(t._sum.sgst || 0),
        igst: Number(t._sum.igst || 0),
        total: Number(t._sum.totalAmount || 0),
        count: t._count,
      })),
      monthlyTrend: monthlyGst.map((m) => ({
        month: m.month,
        cgst: Number(m.cgst || 0),
        sgst: Number(m.sgst || 0),
        igst: Number(m.igst || 0),
        total: roundTo2(Number(m.cgst || 0) + Number(m.sgst || 0) + Number(m.igst || 0)),
      })),
    };
  }

  /**
   * Profit & Loss Report
   */
  async profitLossReport(
    tenantId: string,
    fromDate: string,
    toDate: string
  ) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const [revenue, expenses, expensesByCategory] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          invoiceDate: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
        },
        _sum: {
          subtotal: true,
          cgst: true,
          sgst: true,
          igst: true,
          totalAmount: true,
          discount: true,
        },
      }),

      prisma.expense.aggregate({
        where: {
          tenantId,
          expenseDate: { gte: from, lte: to },
        },
        _sum: { amount: true, gstAmount: true },
        _count: true,
      }),

      prisma.expense.groupBy({
        by: ['category'],
        where: {
          tenantId,
          expenseDate: { gte: from, lte: to },
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    const totalRevenue = Number(revenue._sum.subtotal || 0);
    const totalExpenses = Number(expenses._sum.amount || 0);
    const netProfit = roundTo2(totalRevenue - totalExpenses);
    const margin = totalRevenue > 0 ? roundTo2((netProfit / totalRevenue) * 100) : 0;

    return {
      income: {
        revenue: totalRevenue,
        totalInvoiceAmount: Number(revenue._sum.totalAmount || 0),
        discount: Number(revenue._sum.discount || 0),
      },
      expenses: {
        total: totalExpenses,
        gstOnExpenses: Number(expenses._sum.gstAmount || 0),
        count: expenses._count,
        byCategory: expensesByCategory.map((c) => ({
          category: c.category,
          amount: Number(c._sum.amount || 0),
          count: c._count,
        })),
      },
      profitLoss: {
        netProfit,
        profitMargin: margin,
        isProfit: netProfit >= 0,
      },
    };
  }

  /**
   * Outstanding Report: Unpaid / partially paid invoices
   */
  async outstandingReport(tenantId: string) {
    const [invoices, summary, ageing] = await Promise.all([
      // All outstanding invoices
      prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          totalAmount: true,
          amountPaid: true,
          status: true,
          customer: { select: { id: true, name: true, gstin: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),

      // Summary totals
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        },
        _sum: { totalAmount: true, amountPaid: true },
        _count: true,
      }),

      // By customer
      prisma.invoice.groupBy({
        by: ['customerId'],
        where: {
          tenantId,
          status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        },
        _sum: { totalAmount: true, amountPaid: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
      }),
    ]);

    // Customer names
    const customerIds = ageing.map((a) => a.customerId);
    const customers = customerIds.length > 0
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];
    const customerMap = new Map(customers.map((c) => [c.id, c.name]));

    // Calculate overdue ageing
    const now = new Date();
    const overdueInvoices = invoices.filter((inv) => new Date(inv.dueDate) < now);
    const ageingBuckets = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, overNinety: 0 };

    overdueInvoices.forEach((inv) => {
      const daysDue = Math.floor(
        (now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const outstanding = Number(inv.totalAmount) - Number(inv.amountPaid);
      if (daysDue <= 0) ageingBuckets.current += outstanding;
      else if (daysDue <= 30) ageingBuckets.thirtyDays += outstanding;
      else if (daysDue <= 60) ageingBuckets.sixtyDays += outstanding;
      else if (daysDue <= 90) ageingBuckets.ninetyDays += outstanding;
      else ageingBuckets.overNinety += outstanding;
    });

    return {
      summary: {
        totalOutstanding: roundTo2(
          Number(summary._sum.totalAmount || 0) - Number(summary._sum.amountPaid || 0)
        ),
        totalInvoiced: Number(summary._sum.totalAmount || 0),
        totalPaid: Number(summary._sum.amountPaid || 0),
        invoiceCount: summary._count,
        overdueCount: overdueInvoices.length,
      },
      ageing: {
        current: roundTo2(ageingBuckets.current),
        '1-30 days': roundTo2(ageingBuckets.thirtyDays),
        '31-60 days': roundTo2(ageingBuckets.sixtyDays),
        '61-90 days': roundTo2(ageingBuckets.ninetyDays),
        '90+ days': roundTo2(ageingBuckets.overNinety),
      },
      byCustomer: ageing.map((a) => ({
        customerId: a.customerId,
        customerName: customerMap.get(a.customerId) || 'Unknown',
        totalInvoiced: Number(a._sum.totalAmount || 0),
        totalPaid: Number(a._sum.amountPaid || 0),
        outstanding: roundTo2(
          Number(a._sum.totalAmount || 0) - Number(a._sum.amountPaid || 0)
        ),
        invoiceCount: a._count,
      })),
      invoices: invoices.map((inv) => ({
        ...inv,
        totalAmount: Number(inv.totalAmount),
        amountPaid: Number(inv.amountPaid),
        outstanding: roundTo2(Number(inv.totalAmount) - Number(inv.amountPaid)),
        isOverdue: new Date(inv.dueDate) < now,
      })),
    };
  }

  async quotationReport(
    tenantId: string,
    fromDate: string,
    toDate: string
  ) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    const where: Prisma.QuotationWhereInput = {
      tenantId,
      quotationDate: { gte: from, lte: to },
    };

    const [totals, byStatus, topCustomers, monthlyTrend] = await Promise.all([
      prisma.quotation.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),
      prisma.quotation.groupBy({
        by: ['status'],
        where,
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.quotation.groupBy({
        by: ['customerId'],
        where,
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      prisma.$queryRaw<{ month: string; total: number; count: bigint }[]>`
        SELECT 
          TO_CHAR(quotation_date, 'YYYY-MM') as month,
          SUM(total_amount)::float as total,
          COUNT(*)::bigint as count
        FROM quotations
        WHERE tenant_id = ${tenantId}::uuid
          AND quotation_date >= ${from}
          AND quotation_date <= ${to}
        GROUP BY TO_CHAR(quotation_date, 'YYYY-MM')
        ORDER BY month ASC
      `,
    ]);

    const customerIds = topCustomers.map((item) => item.customerId);
    const customers = customerIds.length
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];
    const customerMap = new Map(customers.map((customer) => [customer.id, customer.name]));

    const sentCount = byStatus.find((item) => item.status === 'SENT')?._count || 0;
    const acceptedCount = byStatus.find((item) => item.status === 'ACCEPTED')?._count || 0;
    const convertedCount = byStatus.find((item) => item.status === 'CONVERTED')?._count || 0;
    const allCount = totals._count || 0;

    return {
      summary: {
        quotationCount: allCount,
        totalValue: Number(totals._sum.totalAmount || 0),
        sentCount,
        acceptedCount,
        convertedCount,
        acceptanceRate: sentCount > 0 ? roundTo2((acceptedCount / sentCount) * 100) : 0,
        conversionRate: allCount > 0 ? roundTo2((convertedCount / allCount) * 100) : 0,
      },
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        total: Number(item._sum.totalAmount || 0),
      })),
      topCustomers: topCustomers.map((item) => ({
        customerId: item.customerId,
        customerName: customerMap.get(item.customerId) || 'Unknown',
        quotationCount: item._count,
        total: Number(item._sum.totalAmount || 0),
      })),
      monthlyTrend: monthlyTrend.map((item) => ({
        month: item.month,
        total: Number(item.total || 0),
        count: Number(item.count),
      })),
    };
  }
}

export const reportService = new ReportService();
