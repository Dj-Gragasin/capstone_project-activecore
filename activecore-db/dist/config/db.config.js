"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initializeDatabase = initializeDatabase;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('🔍 Database Configuration:');
console.log('   Host:', process.env.DB_HOST || 'localhost');
console.log('   Port:', process.env.DB_PORT || '5432');
console.log('   User:', process.env.DB_USER || 'postgres');
console.log('   Database:', process.env.DB_NAME || 'activecore');
const pgPool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'activecore',
    max: 10,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms for remote databases
    ssl: ((_a = process.env.DB_HOST) === null || _a === void 0 ? void 0 : _a.includes('render.com')) ? { rejectUnauthorized: false } : false,
});
// Create wrapper to provide MySQL-compatible interface
class MySQLCompatiblePool {
    constructor(pool) {
        this.pgPool = pool;
    }
    query(sql, values) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Convert MySQL placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
                let pgSql = sql;
                let paramIndex = 1;
                pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
                const result = yield this.pgPool.query(pgSql, values || []);
                // Create a compatible result object that looks like MySQL results
                const fields = {
                    affectedRows: result.rowCount || 0,
                };
                // Return as a tuple that can be destructured
                return [result.rows, fields];
            }
            catch (error) {
                throw error;
            }
        });
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.pgPool.connect();
        });
    }
    end() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.pgPool.end();
        });
    }
}
exports.pool = new MySQLCompatiblePool(pgPool);
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('\n🔌 Connecting to database...');
            console.log('   Host:', process.env.DB_HOST || 'localhost');
            console.log('   Port:', process.env.DB_PORT || '5432');
            console.log('   User:', process.env.DB_USER || 'postgres');
            console.log('   Database:', process.env.DB_NAME || 'activecore');
            // Test connection by running a simple query with timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout - database unreachable')), 15000));
            const queryPromise = pgPool.query('SELECT NOW()');
            yield Promise.race([queryPromise, timeoutPromise]);
            console.log('✅ Database connected successfully!');
            console.log('🗄️  Database:', process.env.DB_NAME || 'activecore');
            console.log('📊 Host:', process.env.DB_HOST || 'localhost');
            console.log('');
            return true;
        }
        catch (error) {
            console.error('\n❌ ========================================');
            console.error('❌ DATABASE CONNECTION FAILED');
            console.error('❌ ========================================');
            console.error('Error:', error.message);
            console.error('Code:', error.code);
            console.error('');
            console.error('Attempted connection:');
            console.error('  Host:', process.env.DB_HOST || 'localhost');
            console.error('  Port:', process.env.DB_PORT || '5432');
            console.error('  User:', process.env.DB_USER || 'postgres');
            console.error('  Database:', process.env.DB_NAME || 'activecore');
            console.error('');
            console.error('📝 Troubleshooting steps:');
            console.error('1. Verify .env file exists in activecore-db/ folder');
            console.error('2. Check DB_HOST is correct (e.g., your-render-db.render.com)');
            console.error('3. Confirm DB_PASSWORD is set and correct');
            console.error('4. Verify database "activecore" exists on the server');
            console.error('5. Check if PostgreSQL is running and accessible');
            console.error('6. Ensure your IP is whitelisted (if applicable)');
            console.error('========================================\n');
            return false;
        }
    });
}
