import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(password, hashed);
  }

  static generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = (process.env.JWT_EXPIRES_IN || '24h') as any;
    return jwt.sign(
      { userId },
      secret,
      { expiresIn }
    );
  }

  static async verifyGoogleToken(token: string) {
    try {
      const audience = process.env.GOOGLE_CLIENT_ID;
      const ticket = await client.verifyIdToken({
        idToken: token,
        ...(audience ? { audience } : {})
      } as any);
      return ticket.getPayload();
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }
}
