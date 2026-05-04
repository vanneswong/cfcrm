-- CRM Database Schema v1
-- Cloudflare D1 (SQLite-compatible)

PRAGMA foreign_keys = ON;

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'user')) DEFAULT 'user',
    avatar_url  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    company     TEXT,
    industry    TEXT,
    status      TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'lead')) DEFAULT 'lead',
    source      TEXT,
    email       TEXT,
    phone       TEXT,
    address     TEXT,
    website     TEXT,
    notes       TEXT,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_assigned ON customers(assigned_to);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Contacts (multiple per customer)
CREATE TABLE IF NOT EXISTS contacts (
    id          TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    title       TEXT,
    email       TEXT,
    phone       TEXT,
    department  TEXT,
    is_primary  INTEGER NOT NULL DEFAULT 0,
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_contacts_customer ON contacts(customer_id);

-- Deals / Sales Pipeline
CREATE TABLE IF NOT EXISTS deals (
    id                TEXT PRIMARY KEY,
    customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    amount            REAL NOT NULL DEFAULT 0,
    stage             TEXT NOT NULL CHECK(stage IN (
        'qualification', 'needs_analysis', 'proposal', 
        'negotiation', 'closed_won', 'closed_lost'
    )) DEFAULT 'qualification',
    probability       INTEGER NOT NULL DEFAULT 20,
    expected_close_date TEXT,
    contact_id        TEXT REFERENCES contacts(id) ON DELETE SET NULL,
    assigned_to       TEXT REFERENCES users(id) ON DELETE SET NULL,
    notes             TEXT,
    created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_deals_customer ON deals(customer_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);

-- Interactions (calls, meetings, emails, notes)
CREATE TABLE IF NOT EXISTS interactions (
    id          TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    deal_id     TEXT REFERENCES deals(id) ON DELETE SET NULL,
    type        TEXT NOT NULL CHECK(type IN ('call', 'meeting', 'email', 'note', 'task')),
    subject     TEXT NOT NULL,
    body        TEXT,
    contact_id  TEXT REFERENCES contacts(id) ON DELETE SET NULL,
    occurred_at TEXT,
    created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_interactions_customer ON interactions(customer_id);
CREATE INDEX idx_interactions_deal ON interactions(deal_id);
CREATE INDEX idx_interactions_created ON interactions(created_at);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id    TEXT PRIMARY KEY,
    name  TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1'
);

-- Customer-Tag M:N
CREATE TABLE IF NOT EXISTS customer_tags (
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, tag_id)
);

-- Documents (R2 object references)
CREATE TABLE IF NOT EXISTS documents (
    id          TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    deal_id     TEXT REFERENCES deals(id) ON DELETE SET NULL,
    filename    TEXT NOT NULL,
    r2_key      TEXT NOT NULL,
    size        INTEGER,
    mime_type   TEXT,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_documents_customer ON documents(customer_id);
CREATE INDEX idx_documents_deal ON documents(deal_id);

-- Seed data: default admin user (password: admin123)
-- INSERT INTO users (id, email, password_hash, name, role) 
-- VALUES ('u-admin-001', 'admin@crm.local', '$2a$...', 'Admin', 'admin');
