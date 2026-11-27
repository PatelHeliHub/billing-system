import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

export class ReportController {

  static async getSalesSummary(req: Request, res: Response) {
    try {
      const { range = 'month', startDate, endDate } = req.query;
      let start: Date;
      let end = endOfDay(new Date());

      if (range === 'custom' && startDate && endDate) {
        start = startOfDay(new Date(String(startDate)));
        end = endOfDay(new Date(String(endDate)));
      } else if (range === 'today') {
        start = startOfDay(new Date());
      } else if (range === 'week') {
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
      } else if (range === 'month') {
        start = startOfMonth(new Date());
      } else {
        start = subDays(new Date(), 30);
      }

      // 1. Sales Metrics for the period
      const sales = await prisma.invoice.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['cancelled', 'draft'] }
        },
        _sum: { totalAmount: true },
        _count: { id: true }
      });

      const totalRevenue = sales._sum.totalAmount || 0;
      const invoiceCount = sales._count.id || 0;
      const avgOrderValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

      // 1.1 Calculate Profit for the period
      const invoicesWithItems = await prisma.invoice.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['cancelled', 'draft'] }
        },
        include: { items: true }
      });

      const totalProfit = invoicesWithItems.reduce((acc, inv) => {
        const cost = inv.items.reduce((cAcc, item) => cAcc + (item.costPrice * item.quantity), 0);
        return acc + (inv.totalAmount - inv.taxAmount - cost);
      }, 0);

      // 2. Inventory Metrics (Live snapshot)
      const lowStockCount = await prisma.product.count({
        where: { stockQuantity: { lt: prisma.product.fields.minStockLevel } }
      });

      const products = await prisma.product.findMany({
        select: { stockQuantity: true, price: true }
      });
      const inventoryValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.price), 0);

      // 3. Sales Trend for the selected period (max 30 points)
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const trendPoints = diffDays > 31 ? 30 : (diffDays + 1);
      
      const trend = await Promise.all(
        Array.from({ length: trendPoints }, (_, i) => {
          const d = subDays(end, trendPoints - 1 - i);
          return { start: startOfDay(d), end: endOfDay(d), label: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) };
        }).map(async (day) => {
          const daySales = await prisma.invoice.aggregate({
            where: {
              createdAt: { gte: day.start, lte: day.end },
              status: { notIn: ['cancelled', 'draft'] }
            },
            _sum: { totalAmount: true }
          });
          return { name: day.label, revenue: daySales._sum.totalAmount || 0 };
        })
      );

      res.json({
        totalRevenue,
        totalProfit,
        invoiceCount,
        avgOrderValue,
        lowStockCount,
        inventoryValue,
        trend
      });
    } catch (error) {
      console.error('Sales summary error:', error);
      res.status(500).json({ error: 'Failed to fetch sales summary' });
    }
  }

  static async getProductPerformance(req: Request, res: Response) {
    try {
      // Top 5 products by quantity sold
      const topProducts = await prisma.invoiceItem.groupBy({
        by: ['productId', 'name'],
        where: {
          invoice: { status: { notIn: ['cancelled', 'draft'] } }
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      });

      const formatted = topProducts.map(p => ({
        name: p.name,
        quantity: p._sum.quantity || 0,
        revenue: p._sum.total || 0
      }));

      res.json(formatted);
    } catch (error) {
      console.error('Product performance error:', error);
      res.status(500).json({ error: 'Failed to fetch product stats' });
    }
  }

  static async getInventoryHealth(req: Request, res: Response) {
    try {
      const lowStock = await prisma.product.findMany({
        where: {
          stockQuantity: { lt: prisma.product.fields.minStockLevel }
        },
        select: {
          name: true,
          stockQuantity: true,
          minStockLevel: true
        },
        orderBy: { stockQuantity: 'asc' }
      });

      const totalStockValue = await prisma.product.aggregate({
        _sum: { stockQuantity: true }
      });

      res.json({
        lowStockItems: lowStock,
        totalItemsCount: totalStockValue._sum.stockQuantity || 0
      });
    } catch (error) {
      console.error('Inventory health error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory report' });
    }
  }

  static async getPurchaseReport(req: Request, res: Response) {
    try {
      const purchases = await prisma.purchase.findMany({
        include: {
          supplier: { select: { supplierName: true } },
          items: true
        },
        orderBy: { purchaseDate: 'desc' },
        take: 20
      });

      res.json(purchases);
    } catch (error) {
      console.error('Purchase report error:', error);
      res.status(500).json({ error: 'Failed to fetch purchase report' });
    }
  }

  static async getDailyClosing(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(String(date)) : new Date();
      
      const start = startOfDay(targetDate);
      const end = endOfDay(targetDate);

      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['cancelled', 'draft'] }
        },
        include: {
          items: true
        }
      });

      const summary = {
        date: start,
        totalSales: 0,
        invoiceCount: invoices.length,
        paymentMethods: {
          cash: 0,
          card: 0,
          upi: 0
        },
        totalProfit: 0,
        receivedAmount: 0,
        dueAmount: 0
      };

      invoices.forEach(inv => {
        summary.totalSales += inv.totalAmount;
        summary.receivedAmount += inv.amountPaid;
        summary.dueAmount += inv.dueAmount;

        const method = (inv.paymentMethod || 'cash').toLowerCase() as keyof typeof summary.paymentMethods;
        if (summary.paymentMethods[method] !== undefined) {
          summary.paymentMethods[method] += inv.totalAmount;
        }

        // Calculate Profit: Total - Cost
        const cost = inv.items.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
        summary.totalProfit += (inv.totalAmount - inv.taxAmount - cost); // Net profit excluding tax
      });

      res.json(summary);
    } catch (error) {
      console.error('Daily closing error:', error);
      res.status(500).json({ error: 'Failed to fetch daily closing report' });
    }
  }
}
