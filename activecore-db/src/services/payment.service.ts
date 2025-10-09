import { Request, Response } from 'express';
import { pool } from '../config/db.config';
import { Payment, PaymentCreate } from '../models/Payment';
import { validatePayment } from '../utils/validation';

export const createPayment = async (req: Request, res: Response) => {
    try {
        const paymentData: PaymentCreate = req.body;
        const errors = validatePayment(paymentData);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const [result]: any = await pool.query(
            'INSERT INTO payments (user_id, subscription_id, amount) VALUES (?, ?, ?)',
            [paymentData.userId, paymentData.subscriptionId, paymentData.amount]
        );

        res.status(201).json({
            message: 'Payment created successfully',
            paymentId: result.insertId
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating payment', error });
    }
};