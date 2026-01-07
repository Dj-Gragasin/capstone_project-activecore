import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

interface AuthRequest extends Request {
  user?: any;
}

interface QRTokenResponse {
  success: boolean;
  token?: string;
  tokenId?: number;
  expiresAt?: string;
  message?: string;
}

// Inline auth middleware for this route
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Generate QR token for attendance
 * POST /api/admin/qr-token/generate
 */
router.post('/generate', authenticateToken, (req: AuthRequest, res: Response<QRTokenResponse>) => {
  try {
    // Validate user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - no user context'
      });
    }

    // Generate token
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const token = `QR_${now.getTime()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const tokenId = Math.floor(Math.random() * 100000);

    // Return success
    return res.json({
      success: true,
      token,
      tokenId,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error: any) {
    console.error('QR Token generation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate QR token'
    });
  }
});

export default router;
