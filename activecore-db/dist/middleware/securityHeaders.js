"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = void 0;
const securityHeaders = (req, res, next) => {
    // Content Security Policy
    // Prevents XSS attacks by controlling resource loading
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data: https://cdn.jsdelivr.net; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none'; " +
        "form-action 'self' https:;");
    // X-Frame-Options
    // Prevents clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');
    // X-Content-Type-Options
    // Prevents MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Strict-Transport-Security (HSTS)
    // Forces HTTPS connections (only in production)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    // Referrer-Policy
    // Controls referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // X-Permitted-Cross-Domain-Policies
    // Restricts Adobe Flash and PDF loading
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    // Permissions-Policy
    // Controls browser features and APIs
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
    next();
};
exports.securityHeaders = securityHeaders;
exports.default = exports.securityHeaders;
