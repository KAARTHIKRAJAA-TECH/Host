import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import { resolve } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';

// Ensure the database directory exists
const dbDir = resolve('./sqlite');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
  console.log('Created SQLite database directory');
}

// Database path
const dbPath = resolve(dbDir, 'content-shield.db');
console.log(`Using SQLite database at: ${dbPath}`);

// Create SQLite connection
const sqlite = new Database(dbPath);
console.log('SQLite database connection established');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Run migrations programmatically
console.log('Setting up database schema...');
try {
  // Check if tables already exist
  let userTableExists = false;
  try {
    const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users';").get();
    userTableExists = !!result;
    console.log('User table exists:', userTableExists);
  } catch (e) {
    console.log('Error checking if users table exists:', e);
  }
  
  if (!userTableExists) {
    console.log('Creating tables...');
    
    // Create tables directly using SQLite syntax
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        license_type TEXT NOT NULL,
        allow_download INTEGER DEFAULT 0,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        content_type TEXT NOT NULL,
        content_hash TEXT NOT NULL UNIQUE,
        price INTEGER,
        owner_id INTEGER NOT NULL,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );
    `;
    
    const createLicenseRequestsTable = `
      CREATE TABLE IF NOT EXISTS license_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        requester_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );
    `;
    
    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;
    
    const createLikesTable = `
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;
    
    const createDeleteRequestsTable = `
      CREATE TABLE IF NOT EXISTS delete_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;
    
    // Execute all create table statements
    sqlite.exec(createUsersTable);
    sqlite.exec(createPostsTable);
    sqlite.exec(createLicenseRequestsTable);
    sqlite.exec(createCommentsTable);
    sqlite.exec(createLikesTable);
    sqlite.exec(createDeleteRequestsTable);
    
    console.log('SQLite tables created successfully');
    
    // Create admin user if not exists
    const adminExists = sqlite.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get('admin@contentshield.com') as { count: number };
    
    if (adminExists.count === 0) {
      // Admin password is hashed version of "admin123"
      const adminPassword = '$2b$10$qBBsvYHvnG0z3lq50qLSsOIVVpNYr.sKxd9gfvzS.Z3q0qqQ6a/pG';
      
      sqlite.prepare(`
        INSERT INTO users (email, password, role) 
        VALUES (?, ?, ?)
      `).run('admin@contentshield.com', adminPassword, 'admin');
      
      console.log('Created admin user (admin@contentshield.com)');
    } else {
      console.log('Admin user already exists');
    }
  } else {
    console.log('Tables already exist, skipping creation');
  }
} catch (error) {
  console.error('Error setting up database schema:', error);
}

// For PostgreSQL compatibility in the rest of the codebase
export const pool = {
  query: async () => {
    console.log('Simulating PostgreSQL query through SQLite');
    return { rows: [{ now: new Date().toISOString() }] };
  }
};