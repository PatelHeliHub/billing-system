import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class InvoiceController {
  
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      const [
        globalAgg,
        todayAgg,
        yesterdayAgg,
        totalProducts,
        totalCustomers,
        lowStockResult,
        statusCounts
      ] = await Promise.all([
        // Global sums and counts
        prisma.invoice.aggregate({
          _sum: { totalAmount: true, amountPaid: true, dueAmount: true },
          _count: { _all: true }
        }),
        // Today's performance
        prisma.invoice.aggregate({
          where: { createdAt: { gte: todayStart } },
          _sum: { totalAmount: true },
          _count: { _all: true }
        }),
        // Yesterday's performance (for trends)
        prisma.invoice.aggregate({
          where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
          _sum: { totalAmount: true },
          _count: { _all: true }
        }),
        prisma.product.count(),
        prisma.customer.count(),
        // Safe alternative to raw SQL for field comparison
        prisma.product.findMany({
          select: { stockQuantity: true, minStockLevel: true }
        }),
        // Status breakdown
        prisma.invoice.groupBy({
          by: ['status'],
          _count: { _all: true },
          _sum: { dueAmount: true }
        })
      ]);

      const salesToday = todayAgg._sum.totalAmount || 0;
      const salesYesterday = yesterdayAgg._sum.totalAmount || 0;
      const ordersToday = todayAgg._count._all;
      const ordersYesterday = yesterdayAgg._count._all;

      const salesTrend = salesYesterday === 0 ? 0 : ((salesToday - salesYesterday) / salesYesterday) * 100;
      const orderTrend = ordersYesterday === 0 ? 0 : ((ordersToday - ordersYesterday) / ordersYesterday) * 100;

      // Calculate Profit Today
      const todayInvoices = await prisma.invoice.findMany({
        where: { createdAt: { gte: todayStart }, status: { notIn: ['cancelled', 'draft'] } },
        include: { items: true }
      });

      const profitToday = todayInvoices.reduce((acc, inv) => {
        const cost = inv.items.reduce((cAcc, item) => cAcc + (item.costPrice * item.quantity), 0);
        return acc + (inv.totalAmount - inv.taxAmount - cost);
      }, 0);

      // Map status counts
      const counts: any = { paid: 0, unpaid: 0, partial: 0, overdue: 0, cancelled: 0, draft: 0 };
      const overdueAmounts = { overdue: 0 };
      
      statusCounts.forEach(group => {
        if (group.status in counts) {
          counts[group.status] = group._count._all;
        }
      });

      // Fetch overdue amount specifically (as it involves date logic)
      const overdueAgg = await prisma.invoice.aggregate({
        where: {
          status: { notIn: ['paid', 'cancelled'] },
          dueDate: { lt: now }
        },
        _sum: { dueAmount: true },
        _count: { _all: true }
      });

      const stats = {
        totalCount: globalAgg._count._all,
        salesToday,
        profitToday,
        ordersToday,
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockResult.filter((p: any) => p.stockQuantity <= p.minStockLevel).length,
        salesTrend: Number(salesTrend.toFixed(1)),
        orderTrend: Number(orderTrend.toFixed(1)),
        counts: {
          ...counts,
          overdue: overdueAgg._count._all
        },
        amounts: {
          total: globalAgg._sum.totalAmount || 0,
          received: globalAgg._sum.amountPaid || 0,
          pending: globalAgg._sum.dueAmount || 0,
          overdue: overdueAgg._sum.dueAmount || 0,
        }
      };

      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  static async getInvoices(req: Request, res: Response) {
    try {
      const { status, search } = req.query;

      const where: any = {};
      
      if (status && status !== 'all') {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
          { customer: { name: { contains: String(search), mode: 'insensitive' } } }
        ];
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: { name: true }
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json(invoices);
    } catch (error) {
      console.error('Invoice list error:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  }

  static async getInvoiceById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          items: true
        }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Fetch invoice error:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  }

  static async createInvoice(req: Request, res: Response) {
    try {
      const { customerId, dueDate, items, discountPercent = 0, redeemedPoints = 0, status = 'unpaid', paymentMethod = 'cash' } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Invoice must have at least one item' });
      }

      // Safe number converter
      const toNum = (val: any) => {
        const n = Number(val);
        return isNaN(n) ? 0 : n;
      };

      // Check customer loyalty balance if redemption is requested
      // (Moved after initial customer fetch for efficiency)

      // Generate Invoice Number
      const year = new Date().getFullYear();
      const lastInvoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: `INV-${year}` } },
        orderBy: { invoiceNumber: 'desc' }
      });

      let nextNumber = 1;
      if (lastInvoice) {
        const lastParts = String(lastInvoice.invoiceNumber).split('-');
        if (lastParts.length >= 3) {
          const lastNum = parseInt(lastParts[2] as string);
          if (!isNaN(lastNum)) {
            nextNumber = lastNum + 1;
          }
        }
      }
      const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
      
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        return res.status(404).json({ error: 'Selected customer not found in database. Please re-select or create the customer.' });
      }

      if (toNum(redeemedPoints) > 0 && customer.loyaltyPoints < toNum(redeemedPoints)) {
        return res.status(400).json({ error: 'Insufficient loyalty points' });
      }

      let subtotal = 0;
      let totalTax = 0;

      const preparedItems = await Promise.all(items.map(async (item: any) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        const costPrice = product?.costPrice || 0;
        
        const itemSubtotal = toNum(item.price) * toNum(item.quantity);
        const itemDiscount = itemSubtotal * (toNum(discountPercent) / 100);
        const taxableAmount = itemSubtotal - itemDiscount;
        const itemTax = taxableAmount * (toNum(item.gstPercent) / 100);
        const itemTotal = taxableAmount + itemTax;

        subtotal += itemSubtotal;
        totalTax += itemTax;

        return {
          productId: item.productId,
          name: item.name || 'Unknown Product',
          quantity: Math.round(toNum(item.quantity)) || 1,
          price: toNum(item.price),
          costPrice: toNum(costPrice),
          discountPercent: toNum(discountPercent),
          taxAmount: toNum(itemTax),
          gstPercent: toNum(item.gstPercent),
          total: toNum(itemTotal)
        };
      }));

      // Calculate Totals
      const subtotalWithDiscount = subtotal * (1 - toNum(discountPercent) / 100);
      const totalBeforeRedemption = subtotalWithDiscount + totalTax;
      const redemptionAmount = toNum(redeemedPoints);
      const totalAmount = Math.max(0, totalBeforeRedemption - redemptionAmount);

      const initialAmountPaid = toNum(req.body.amountPaid);
      const dueAmount = Math.max(0, totalAmount - initialAmountPaid);
      
      let finalStatus = status;
      if (dueAmount <= 0) finalStatus = 'paid';
      else if (initialAmountPaid > 0) finalStatus = 'partial';
      else finalStatus = 'unpaid';

      const earnedPoints = Math.floor(totalAmount / 100);

      let parsedDueDate = null;
      if (dueDate) {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) parsedDueDate = d;
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Invoice Base Record
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId,
            dueDate: parsedDueDate,
            subtotal: toNum(subtotal),
            taxAmount: toNum(totalTax),
            discountPercent: toNum(discountPercent),
            totalAmount: toNum(totalAmount),
            amountPaid: toNum(initialAmountPaid),
            dueAmount: toNum(dueAmount),
            status: finalStatus,
            paymentMethod,
            earnedPoints: toNum(earnedPoints),
            redeemedPoints: toNum(redeemedPoints)
          }
        });

        // 2. Create Invoice Items
        for (const item of preparedItems) {
          try {
            await tx.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                productId: String(item.productId),
                name: String(item.name || 'Product'),
                quantity: Math.max(1, Math.round(Number(item.quantity))),
                price: Number(item.price) || 0,
                costPrice: Number(item.costPrice) || 0,
                discountPercent: Number(item.discountPercent) || 0,
                taxAmount: Number(item.taxAmount) || 0,
                gstPercent: Number(item.gstPercent) || 0,
                total: Number(item.total) || 0
              }
            });
          } catch (itemError: any) {
            console.error('Error creating invoice item:', itemError);
            throw new Error(`Failed to save item "${item.name}": ${itemError.message}`);
          }
        }

        // 3. Create Payment record if applicable
        if (initialAmountPaid > 0) {
          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: toNum(initialAmountPaid),
              paymentMethod: paymentMethod,
              note: 'Checkout payment'
            }
          });
        }

        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { 
              increment: toNum(earnedPoints) - toNum(redeemedPoints) 
            }
          }
        });

        // 3. Update Inventory and Create Movement
        for (const item of preparedItems) {
          // Check stock before decrementing
          const currentProduct = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stockQuantity: true, minStockLevel: true }
          });

          if (!currentProduct || currentProduct.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for product '${currentProduct?.name || item.name}'. available: ${currentProduct?.stockQuantity || 0}, requested: ${item.quantity}`);
          }

          const product = await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity }
            }
          });

          // Create Movement
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              movementType: 'SALE',
              quantity: item.quantity,
              referenceId: invoiceNumber
            }
          });

          // Low Stock Detection
          if (product.stockQuantity < product.minStockLevel) {
            // Get admins/managers to notify
            const users = await tx.user.findMany({
              where: { role: { name: { in: ['Admin', 'Manager'] } } }
            });

            for (const user of users) {
              await tx.notification.create({
                data: {
                  userId: user.id,
                  title: 'Low Stock Alert',
                  message: `Low Stock Alert: Product '${product.name}' has only ${product.stockQuantity} units left. Minimum required stock is ${product.minStockLevel}. Please reorder soon.`,
                  type: 'low_stock'
                }
              });
            }
          }
        }

        // 5. Return full invoice for POS receipt
        return await tx.invoice.findUnique({
          where: { id: invoice.id },
          include: { items: true, payments: true, customer: true }
        });
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Invoice creation error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code // Prisma error codes
      });
      
      res.status(400).json({ 
        error: 'Database Error',
        details: error.message,
        code: error.code
      });
    }
  }

  static async deleteInvoice(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      await prisma.$transaction(async (tx) => {
        // Restore stock and record movement (cancellation/deletion)
        for (const item of invoice.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity }
            }
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              movementType: 'ADJUSTMENT',
              quantity: item.quantity,
              referenceId: `DELETED-${invoice.invoiceNumber}`
            }
          });
        }

        // Delete items and invoice
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoice.delete({ where: { id } });
      });

      res.json({ message: 'Invoice deleted and stock restored' });
    } catch (error) {
      console.error('Delete invoice error:', error);
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  }

  static async recordPayment(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { amount, paymentMethod, note } = req.body;
      const paymentAmount = Number(amount);

      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({ where: { id } });
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.dueAmount <= 0) throw new Error('Invoice is already fully paid');

        const newAmountPaid = invoice.amountPaid + paymentAmount;
        const newDueAmount = Math.max(0, invoice.totalAmount - newAmountPaid);
        
        let newStatus = invoice.status;
        if (newDueAmount <= 0) newStatus = 'paid';
        else newStatus = 'partial';

        // 1. Create Payment record
        await tx.payment.create({
          data: {
            invoiceId: id,
            amount: paymentAmount,
            paymentMethod: paymentMethod || 'cash',
            note: note || 'Partial payment'
          }
        });

        // 2. Update Invoice
        return await tx.invoice.update({
          where: { id },
          data: {
            amountPaid: newAmountPaid,
            dueAmount: newDueAmount,
            status: newStatus
          },
          include: { payments: true }
        });
      });

      res.json(result);
    } catch (error: any) {
      console.error('Record payment error:', error);
      res.status(400).json({ error: error.message || 'Failed to record payment' });
    }
  }

  static async updateInvoiceStatus(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      const invoice = await prisma.invoice.update({
        where: { id },
        data: { status }
      });

      res.json(invoice);
    } catch (error) {
      console.error('Update status error:', error);
      res.status(400).json({ error: 'Failed to update status' });
    }
  }
}
