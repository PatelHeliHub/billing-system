import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class InventoryController {
  
  static async getOverview(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          minStockLevel: true,
          category: true,
        },
        orderBy: { name: 'asc' }
      });

      const processedProducts = products.map(p => {
        let status = 'In Stock';
        if (p.stockQuantity === 0) status = 'Out of Stock';
        else if (p.stockQuantity < p.minStockLevel) status = 'Low Stock';
        
        return {
          ...p,
          status,
          isLowStock: p.stockQuantity < p.minStockLevel,
          isOutOfStock: p.stockQuantity === 0
        };
      });

      res.json(processedProducts);
    } catch (error) {
      console.error('Inventory overview error:', error);
      res.status(500).json({ error: 'Failed to fetch inventory overview' });
    }
  }

  static async getMovements(req: Request, res: Response) {
    try {
      const { productId, type } = req.query;

      const where: any = {};
      if (productId) where.productId = String(productId);
      if (type) where.movementType = String(type);

      const movements = await prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json(movements);
    } catch (error) {
      console.error('Inventory movement error:', error);
      res.status(500).json({ error: 'Failed to fetch stock movements' });
    }
  }

  static async adjustStock(req: Request, res: Response) {
    try {
      const { productId, quantity, type, referenceId } = req.body;

      if (!productId || quantity === undefined || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update product stock
        const product = await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: type === 'PURCHASE' || (type === 'ADJUSTMENT' && quantity > 0) 
              ? { increment: Math.abs(quantity) } 
              : { decrement: Math.abs(quantity) }
          }
        });

        // Record movement
        const movement = await tx.inventoryMovement.create({
          data: {
            productId,
            movementType: type,
            quantity: Math.abs(quantity),
            referenceId: referenceId || 'Manual Adjustment'
          }
        });

        // Trigger Notification if low stock
        if (product.stockQuantity < product.minStockLevel) {
          const managers = await tx.user.findMany({
            where: { role: { name: { in: ['Admin', 'Manager'] } } }
          });

          for (const manager of managers) {
            await tx.notification.create({
              data: {
                userId: manager.id,
                title: 'Low Stock Alert',
                message: `Low Stock Alert: Product '${product.name}' has only ${product.stockQuantity} units left. Minimum required stock is ${product.minStockLevel}.`,
                type: 'low_stock'
              }
            });
          }
        }

        return { product, movement };
      });

      res.json(result);
    } catch (error) {
      console.error('Stock adjustment error:', error);
      res.status(400).json({ error: 'Failed to adjust stock' });
    }
  }
}
