import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class PurchaseController {
  
  static async createPurchase(req: Request, res: Response) {
    try {
      const { supplierId, purchaseDate, items, status = 'Pending' } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Purchase must have at least one item' });
      }

      // Generate Purchase Number: PUR-2024-0001
      const year = new Date().getFullYear();
      const lastPurchase = await prisma.purchase.findFirst({
        where: { purchaseNumber: { startsWith: `PUR-${year}` } },
        orderBy: { purchaseNumber: 'desc' }
      });

      let nextNumber = 1;
      if (lastPurchase) {
        const lastParts = String(lastPurchase.purchaseNumber).split('-');
        if (lastParts.length >= 3) {
          const lastNum = parseInt(lastParts[2] as string);
          if (!isNaN(lastNum)) {
            nextNumber = lastNum + 1;
          }
        }
      }
      const purchaseNumber = `PUR-${year}-${String(nextNumber).padStart(4, '0')}`;

      // Calculate totals
      let totalAmount = 0;
      const preparedItems = items.map((item: any) => {
        const subtotal = item.price * item.quantity + (item.tax || 0);
        totalAmount += subtotal;
        return {
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax || 0,
          subtotal
        };
      });

      const purchase = await prisma.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          totalAmount,
          status,
          items: {
            create: preparedItems
          }
        },
        include: { items: true }
      });

      res.status(201).json(purchase);
    } catch (error: any) {
      console.error('Create purchase error:', error);
      res.status(400).json({ error: 'Failed to create purchase order' });
    }
  }

  static async getPurchases(req: Request, res: Response) {
    try {
      const { status, search } = req.query;

      const where: any = {};
      if (status && status !== 'all') where.status = status;
      if (search) {
        where.OR = [
          { purchaseNumber: { contains: String(search), mode: 'insensitive' } },
          { supplier: { supplierName: { contains: String(search), mode: 'insensitive' } } }
        ];
      }

      const purchases = await prisma.purchase.findMany({
        where,
        include: {
          supplier: { select: { supplierName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(purchases);
    } catch (error) {
       console.error('Fetch purchases error:', error);
       res.status(500).json({ error: 'Failed to fetch purchase orders' });
    }
  }

  static async getPurchaseById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: {
          supplier: true,
          items: true
        }
      });

      if (!purchase) return res.status(404).json({ error: 'Purchase order not found' });
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch purchase details' });
    }
  }

  static async receivePurchase(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      const purchase = await prisma.purchase.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
      if (purchase.status === 'Received') {
        return res.status(400).json({ error: 'Purchase has already been received' });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update each product's stock and record movement
        for (const item of purchase.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity }
            }
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              movementType: 'PURCHASE',
              quantity: item.quantity,
              referenceId: purchase.purchaseNumber
            }
          });
        }

        // 2. Mark purchase as Received
        await tx.purchase.update({
          where: { id },
          data: { status: 'Received' }
        });
      });

      res.json({ message: 'Products received and stock updated successfully' });
    } catch (error) {
      console.error('Receive purchase error:', error);
      res.status(500).json({ error: 'Failed to process product receipt' });
    }
  }
}
