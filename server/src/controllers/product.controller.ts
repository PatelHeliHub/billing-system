import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class ProductController {
  
  static async getProducts(req: Request, res: Response) {
    try {
      const { search } = req.query;
      
      const where: any = {};
      
      if (search) {
        const searchStr = String(search);
        where.OR = [
          { barcode: searchStr }, // Exact barcode match first
          { sku: searchStr },     // Exact SKU match
          { name: { contains: searchStr, mode: 'insensitive' } },
          { sku: { contains: searchStr, mode: 'insensitive' } },
          { barcode: { contains: searchStr, mode: 'insensitive' } }
        ];
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const { 
        name, category, sku, barcode, price, costPrice, gstPercent, 
        stockQuantity, minStockLevel, description, brand, unit, 
        taxType, hsnCode, image, supplierId 
      } = req.body;

      const product = await prisma.product.create({
        data: {
          name,
          category,
          sku: sku || null,
          barcode: barcode || null,
          price: Number(price),
          costPrice: Number(costPrice || 0),
          stockQuantity: Number(stockQuantity || 0),
          minStockLevel: Number(minStockLevel || 10),
          description,
          brand,
          unit: unit || 'pcs',
          taxType: taxType || 'Exclusive',
          hsnCode,
          image,
          supplierId: supplierId || null
        }
      });

      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ error: 'Failed to create product. SKU or Barcode might already exist.' });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { 
        name, category, sku, barcode, price, costPrice, gstPercent, 
        stockQuantity, minStockLevel, description, brand, unit, 
        taxType, hsnCode, image, supplierId 
      } = req.body;

      const data: any = {};
      if (name !== undefined) data.name = name;
      if (category !== undefined) data.category = category;
      if (sku !== undefined) data.sku = sku || null;
      if (barcode !== undefined) data.barcode = barcode || null;
      if (price !== undefined) data.price = Number(price);
      if (costPrice !== undefined) data.costPrice = Number(costPrice);
      if (gstPercent !== undefined) data.gstPercent = Number(gstPercent);
      if (stockQuantity !== undefined) data.stockQuantity = Number(stockQuantity);
      if (minStockLevel !== undefined) data.minStockLevel = Number(minStockLevel);
      if (description !== undefined) data.description = description;
      if (brand !== undefined) data.brand = brand;
      if (unit !== undefined) data.unit = unit;
      if (taxType !== undefined) data.taxType = taxType;
      if (hsnCode !== undefined) data.hsnCode = hsnCode;
      if (image !== undefined) data.image = image;
      if (supplierId !== undefined) data.supplierId = supplierId || null;

      const product = await prisma.product.update({
        where: { id },
        data
      });

      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(400).json({ error: 'Failed to update product. Ensure SKU/Barcode are unique.' });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      // Use a transaction to ensure both or neither are deleted
      await prisma.$transaction(async (tx) => {
        // 1. Delete related inventory movements
        await tx.inventoryMovement.deleteMany({
          where: { productId: id }
        });

        // 2. Delete the product
        await tx.product.delete({
          where: { id }
        });
      });

      res.json({ message: 'Product and related history deleted successfully' });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product. It may be linked to existing invoices.' });
    }
  }

  static async bulkCreateProducts(req: Request, res: Response) {
    try {
      const products = req.body.products;
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'Invalid product list' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const created = [];
        for (const p of products) {
          const product = await tx.product.create({
            data: {
              name: p.name,
              category: p.category,
              sku: p.sku || null,
              barcode: p.barcode || null,
              price: Number(p.price || 0),
              costPrice: Number(p.costPrice || 0),
              stockQuantity: Number(p.stockQuantity || 0),
              minStockLevel: Number(p.minStockLevel || 10),
              description: p.description,
              brand: p.brand,
              unit: p.unit || 'pcs',
              taxType: p.taxType || 'Exclusive',
              hsnCode: p.hsnCode,
              gstPercent: Number(p.gstPercent || 0),
              image: p.image
            }
          });
          created.push(product);
        }
        return created;
      });

      res.status(201).json({ message: `Successfully imported ${result.length} products`, count: result.length });
    } catch (error: any) {
      console.error('Bulk create error:', error);
      res.status(400).json({ error: 'Bulk import failed. Ensure all SKUs and Barcodes are unique.' });
    }
  }
}
