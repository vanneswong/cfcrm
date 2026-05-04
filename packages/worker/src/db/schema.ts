// Database type definitions — mirrors migrations/0001_init.sql
// Cloudflare D1 (SQLite-compatible)

export type UserRole = 'admin' | 'manager' | 'user';
export type CustomerStatus = 'active' | 'inactive' | 'lead';
export type DealStage =
  | 'qualification' | 'needs_analysis' | 'proposal'
  | 'negotiation' | 'closed_won' | 'closed_lost';
export type InteractionType = 'call' | 'meeting' | 'email' | 'note' | 'task';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UserPublic = Omit<User, 'password_hash'>;

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  industry: string | null;
  status: CustomerStatus;
  source: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  customer_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  is_primary: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  customer_id: string;
  title: string;
  amount: number;
  stage: DealStage;
  probability: number;
  expected_close_date: string | null;
  contact_id: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  customer_id: string;
  deal_id: string | null;
  type: InteractionType;
  subject: string;
  body: string | null;
  contact_id: string | null;
  occurred_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CustomerTag {
  customer_id: string;
  tag_id: string;
}

export interface Document {
  id: string;
  customer_id: string | null;
  deal_id: string | null;
  filename: string;
  r2_key: string;
  size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// Insert types (omit server-generated fields)
export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>;
export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
export type InteractionInsert = Omit<Interaction, 'id' | 'created_at'>;
export type TagInsert = Omit<Tag, 'id'>;

// Update types (all optional)
export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>;
export type DealUpdate = Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>>;
export type ContactUpdate = Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>;

// Query helpers
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
