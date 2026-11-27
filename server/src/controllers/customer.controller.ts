import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export class CustomerController {
  
  static async getCustomers(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      
      const where: any = {};
      
      if (search) {
        const searchStr = String(search);
        where.OR = [
          { name: { contains: searchStr, mode: 'insensitive' } },
          { phone: { contains: searchStr, mode: 'insensitive' } },
          { email: { contains: searchStr, mode: 'insensitive' } }
        ];
      }

      const customers = await prisma.customer.findMany({
        where: where as any,
        include: {
          invoices: {
            select: {
              totalAmount: true,
              amountPaid: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate totals for each customer
      const customerStats = customers.map(customer => {
        const totalPurchases = customer.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
        const totalPaid = customer.invoices.reduce((sum: number, inv: any) => sum + inv.amountPaid, 0);
        const outstandingBalance = totalPurchases - totalPaid;
        const lastPurchaseDate = customer.invoices.length > 0 ? customer.invoices[0].createdAt : null;
        
        // Remove invoices from the response to keep it clean
        const { invoices, ...rest } = customer;
        return {
          ...rest,
          totalPurchases,
          outstandingBalance,
          lastPurchaseDate
        };
      });

      res.json(customerStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  static async getCustomerById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          invoices: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const totalPurchases = (customer as any).invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
      const totalPaid = (customer as any).invoices.reduce((sum: number, inv: any) => sum + inv.amountPaid, 0);
      const outstandingBalance = totalPurchases - totalPaid;
      const lastPurchaseDate = (customer as any).invoices.length > 0 ? (customer as any).invoices[0].createdAt : null;

      res.json({
        ...customer,
        totalPurchases,
        outstandingBalance,
        lastPurchaseDate
      });
    } catch (error) {
      console.error('Error fetching customer details:', error);
      res.status(500).json({ error: 'Failed to fetch customer details' });
    }
  }

  static async createCustomer(req: Request, res: Response) {
    try {
      const { name, email, phone, address, gstNumber, creditLimit } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and Phone are required' });
      }

      const customer = await prisma.customer.create({
        data: {
          name,
          email: email || null,
          phone: phone,
          address: address || null,
          gstNumber: gstNumber || null,
          creditLimit: creditLimit ? Number(creditLimit) : 0
        }
      });

      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(400).json({ error: 'Failed to create customer. Phone or Email might already exist.' });
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { name, email, phone, address, gstNumber, creditLimit } = req.body;

      const data: any = {};
      if (name !== undefined) data.name = name;
      if (email !== undefined) data.email = email || null;
      if (phone !== undefined) data.phone = phone || null;
      if (address !== undefined) data.address = address || null;
      if (gstNumber !== undefined) data.gstNumber = gstNumber || null;
      if (creditLimit !== undefined) data.creditLimit = Number(creditLimit);

      const customer = await prisma.customer.update({
        where: { id },
        data
      });

      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(400).json({ error: 'Failed to update customer.' });
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      
      // Check if customer has invoices before deleting
      const invoicesCount = await prisma.invoice.count({ where: { customerId: id } as any });
      if (invoicesCount > 0) {
        return res.status(400).json({ error: 'Cannot delete customer with existing invoices. Delete invoices first.' });
      }

      await prisma.customer.delete({ where: { id } });
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  }

  static async getCustomerLedger(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          invoices: {
            include: {
              payments: {
                orderBy: { paymentDate: 'desc' }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Calculate aggregated financial summary for ledger
      const totalInvoiced = customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = customer.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const currentDue = totalInvoiced - totalPaid;

      res.json({
        customerName: customer.name,
        totalInvoiced,
        totalPaid,
        currentDue,
        ledgerEntries: customer.invoices
      });
    } catch (error) {
      console.error('Error fetching ledger:', error);
      res.status(500).json({ error: 'Failed to fetch customer ledger' });
    }
  }
}
