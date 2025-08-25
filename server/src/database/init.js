const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

const DB_PATH = process.env.DATABASE_PATH || './data/desist.db';
const DATA_DIR = path.dirname(DB_PATH);

let db = null;

// Database schema
const SCHEMA = {
  devices: `
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      app_version TEXT NOT NULL,
      platform TEXT NOT NULL,
      security_config JSON,
      is_online BOOLEAN DEFAULT 0,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      threat_level TEXT DEFAULT 'low',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  device_configs: `
    CREATE TABLE IF NOT EXISTS device_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      config JSON NOT NULL,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
    )
  `,
  
  commands: `
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_id TEXT UNIQUE NOT NULL,
      device_id TEXT NOT NULL,
      command TEXT NOT NULL,
      parameters JSON,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME,
      execution_result JSON,
      FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
    )
  `,
  
  sync_logs: `
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      sync_data JSON NOT NULL,
      sync_type TEXT DEFAULT 'regular',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
    )
  `,
  
  status_reports: `
    CREATE TABLE IF NOT EXISTS status_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      status_data JSON NOT NULL,
      report_type TEXT DEFAULT 'regular',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
    )
  `,
  
  admin_users: `
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `,
  
  device_tokens: `
    CREATE TABLE IF NOT EXISTS device_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      is_refresh_token BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
    )
  `
};

// Indexes for better performance
const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices (device_id)',
  'CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices (last_seen)',
  'CREATE INDEX IF NOT EXISTS idx_commands_device_id ON commands (device_id)',
  'CREATE INDEX IF NOT EXISTS idx_commands_status ON commands (status)',
  'CREATE INDEX IF NOT EXISTS idx_commands_created_at ON commands (created_at)',
  'CREATE INDEX IF NOT EXISTS idx_sync_logs_device_id ON sync_logs (device_id)',
  'CREATE INDEX IF NOT EXISTS idx_status_reports_device_id ON status_reports (device_id)',
  'CREATE INDEX IF NOT EXISTS idx_device_tokens_device_id ON device_tokens (device_id)',
  'CREATE INDEX IF NOT EXISTS idx_device_tokens_expires_at ON device_tokens (expires_at)'
];

async function initializeDatabase() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Create database connection
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        throw err;
      }
      logger.info(`Connected to SQLite database at ${DB_PATH}`);
    });

    // Enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON');
    
    // Create tables
    for (const [tableName, schema] of Object.entries(SCHEMA)) {
      await runQuery(schema);
      logger.info(`Table ${tableName} created/verified`);
    }
    
    // Create indexes
    for (const index of INDEXES) {
      await runQuery(index);
    }
    
    logger.info('Database indexes created/verified');
    
    // Create default admin user if it doesn't exist
    await createDefaultAdminUser();
    
    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function createDefaultAdminUser() {
  const bcrypt = require('bcryptjs');
  const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'change-this-secure-password';
  
  try {
    const existingUser = await getQuery(
      'SELECT id FROM admin_users WHERE username = ?',
      [defaultUsername]
    );
    
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(defaultPassword, 12);
      await runQuery(
        'INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)',
        [defaultUsername, passwordHash, 'admin']
      );
      logger.info(`Default admin user created with username: ${defaultUsername}`);
      logger.warn('Please change the default admin password in production!');
    }
  } catch (error) {
    logger.error('Failed to create default admin user:', error);
  }
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        logger.error('Database query error:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        logger.error('Database query error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error('Database query error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  runQuery,
  getQuery,
  allQuery,
  closeDatabase,
  getDatabase: () => db
};
