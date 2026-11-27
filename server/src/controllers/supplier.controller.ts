import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class SupplierController {
  
  static async createSupplier(req: Request, res: Response) {
    try {
      const { 
        supplierName, 
        contactPerson, 
        phone, 
        email, 
        address, 
        gstNumber, 
        status 
      } = req.body;

      if (!supplierName || !contactPerson || !phone) {
        return res.status(400).json({ error: 'Name, contact person and phone are required' });
      }

      const supplier = await prisma.supplier.create({
        data: {
          supplierName,
          contactPerson,
          phone,
          email: email || null,
          address: address || null,
          gstNumber: gstNumber || null,
          status: status || 'Active'
        }
      });

      res.status(201).json(supplier);
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      res.status(400).json({ error: 'Failed to create supplier' });
    }
  }

  static async getSuppliers(req: Request, res: Response) {
    try {
      const { search } = req.query;

      const where: any = {};
      if (search) {
        where.OR = [
          { supplierName: { contains: String(search), mode: 'insensitive' } },
          { contactPerson: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { phone: { contains: String(search), mode: 'insensitive' } }
        ];
      }

      const suppliers = await prisma.supplier.findMany({
        where,
        include: {
          purchases: {
            select: { totalAmount: true, purchaseDate: true }
          }
        },
        orderBy: { supplierName: 'asc' }
      });

      const processedSuppliers = suppliers.map(s => {
        const totalPurchaseAmount = s.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
        const lastOrderDate = s.purchases.length > 0 
          ? s.purchases.reduce((max, p) => p.purchaseDate > max ? p.purchaseDate : max, s.purchases[0].purchaseDate)
          : null;

        return {
          ...s,
          totalOrders: s.purchases.length,
          totalPurchaseAmount,
          lastOrderDate,
          purchases: undefined // Remove detailed purchases to keep payload light
        };
      });

      res.json(processedSuppliers);
    } catch (error) {
      console.error('Fetch suppliers error:', error);
      res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
  }

  static async getSupplierById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const supplier = await prisma.supplier.findUnique({
        where: { id }
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Fetch supplier detail error:', error);
      res.status(500).json({ error: 'Failed to fetch supplier details' });
    }
  }

  static async updateSupplier(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { 
        supplierName, 
        contactPerson, 
        phone, 
        email, 
        address, 
        gstNumber, 
        status 
      } = req.body;

      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          supplierName,
          contactPerson,
          phone,
          email,
          address,
          gstNumber,
          status
        }
      });

      res.json(supplier);
    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(400).json({ error: 'Failed to update supplier' });
    }
  }

  static async deleteSupplier(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      await prisma.supplier.delete({
        where: { id }
      });

      res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({ error: 'Failed to delete supplier' });
    }
  }
}
