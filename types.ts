export enum UserRole {
  OWNER = 'OWNER',       // مالك - كامل الصلاحيات
  ADMIN = 'ADMIN',       // مدير نظام
  ACCOUNTANT = 'ACCOUNTANT', // محاسب
  MANAGER = 'MANAGER',   // مدير فرع
  VIEWER = 'VIEWER',     // مشاهد فقط
  SALES = 'SALES'        // كاشير
}

export enum AppRoute {
  DASHBOARD = 'DASHBOARD',
  SALES = 'SALES',
  PURCHASES = 'PURCHASES',
  INVENTORY = 'INVENTORY',
  EXPENSES = 'EXPENSES',
  PAYROLL = 'PAYROLL',
  FINANCE = 'FINANCE',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export interface User {
  id: string;
  username: string; 
  name: string;
  role: UserRole;
  password?: string; 
  permissions?: string[];
}

export interface StockAlertConfig {
  mode: 'REORDER_LEVEL' | 'GLOBAL_MIN' | 'PERCENTAGE';
  value: number; // Used for GLOBAL_MIN or PERCENTAGE
}

export interface CompanySettings {
  name: string;
  logoUrl?: string;
  currency: string;
  taxRate: number;
  address?: string;
  stockAlert: StockAlertConfig;
  aiFeatures: {
    financialAdvisor: boolean;
    cashFlowAnalysis: boolean;
  };
}

export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  items: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  balance: number;
}

export interface PaymentTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  type: 'PAYMENT' | 'PURCHASE_PARTIAL' | 'PURCHASE_FULL';
  method: 'CASH' | 'VISA' | 'CHEQUE';
  reference?: string; // Cheque number or Invoice number
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string; 
  unitPrice: number;
  reorderLevel: number;
  category: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  baseSalary: number; 
  netSalary: number; 
  status: 'ACTIVE' | 'LEAVE';
  joinDate: string;
  deductions: Deduction[];
  linkedUserId?: string; 
}

export interface Deduction {
  id: string;
  date: string;
  amount: number;
  type: 'QUARTER_DAY' | 'HALF_DAY' | 'FULL_DAY' | 'OTHER' | 'ADVANCE';
  reason: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  approvedBy: string;
}

export interface FinancialMetric {
  label: string;
  value: number;
  trend: number; 
  isPositive: boolean;
}

export interface AppContextState {
  user: User | null;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  activeRoute: AppRoute;
}

export interface RolePermission {
  role: UserRole;
  canEditSettings: boolean;
  canDeleteItems: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}