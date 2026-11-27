import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      const hashedPassword = await AuthService.hashPassword(password);
      
      // Get default role (Cashier)
      const defaultRole = await prisma.role.findUnique({ where: { name: 'Cashier' } });
      
      const userCount = await prisma.user.count();
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          roleId: userCount === 0 ? null : (defaultRole?.id || null),
        },
        include: {
          role: {
            include: { permissions: true }
          }
        }
      });

      const token = AuthService.generateToken(user.id);
      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = await prisma.user.findUnique({ 
        where: { email },
        include: {
          role: {
            include: { permissions: true }
          }
        } 
      });
      if (!user || !user.password) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValid = await AuthService.comparePassword(password, user.password);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = AuthService.generateToken(user.id);
      res.json({ user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({ error: 'Google ID token is required' });
        return;
      }

      const payload = await AuthService.verifyGoogleToken(idToken);
      if (!payload) {
        res.status(401).json({ error: 'Invalid Google token' });
        return;
      }

      const { email, name, sub: googleId } = payload;

      if (!email) {
        res.status(400).json({ error: 'Email not provided by Google' });
        return;
      }

      let user = await prisma.user.findUnique({ 
        where: { email },
        include: {
          role: {
            include: { permissions: true }
          }
        }
      });

      if (!user) {
        const defaultRole = await prisma.role.findUnique({ where: { name: 'Cashier' } });
        user = await prisma.user.create({
          data: {
            email,
            name: name || null,
            provider: 'google',
            providerId: googleId,
            roleId: defaultRole?.id || null
          },
          include: {
            role: {
              include: { permissions: true }
            }
          }
        });
      }

      if (!user) {
        res.status(500).json({ error: 'Failed to create user' });
        return;
      }

      const token = AuthService.generateToken(user.id);
      res.json({ user, token });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
