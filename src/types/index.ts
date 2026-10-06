export type Role = 'stylist' | 'manager';

export type Screen =
  | 'role-selection'
  | 'stylist-pin'
  | 'manager-pin'
  | 'welcome'
  | 'customer-name'
  | 'customer-phone'
  | 'loyalty'
  | 'stylist-selection'
  | 'session-ready'
  | 'stylist-home'
  | 'close-session'
  | 'session-success'
  | 'closed-today'
  | 'stylist-performance'
  | 'stylist-checklist'
  | 'stylist-menu'
  | 'morning-opening'
  | 'manager-home'
  | 'manager-sessions'
  | 'commission'
  | 'cash'
  | 'expenses'
  | 'manager-menu';

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  activeSessions: number;
  completedToday: number;
  revenueToday: number;
  commission: number;
  tips: number;
  commissionPaid: boolean;
  dailyTarget?: number;
  services?: { name: string; count: number }[];
  /** Revenue and tips split by how the customer paid (tips follow the bill's payment mode). */
  cashRevenue?: number;
  gpayRevenue?: number;
  cashTips?: number;
  gpayTips?: number;
  /** Tips already handed over, and what is still available to withdraw. */
  tipsWithdrawn?: number;
  tipsAvailable?: number;
  /** Time spent with customers in the period, and the average per finished session (minutes). */
  workMinutes?: number;
  avgSessionMinutes?: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Session {
  id: string;
  customerName: string;
  customerPhone?: string;
  stylistId: string;
  startTime: Date;
  services: Service[];
  status: 'active' | 'closed';
  total?: number;
  paymentMode?: 'cash' | 'gpay';
  tip?: number;
  tipMode?: 'cash' | 'gpay';
  closedAt?: Date;
  products?: { name: string; price: number; qty: number }[];
  discountType?: 'percent' | 'amount';
  discountValue?: number;
  isEdited?: boolean;
}

export interface Customer {
  name: string;
  phone?: string;
  visitCount: number;
  loyaltyTarget: number;
  rewardReady: boolean;
}

export interface Expense {
  id: string;
  type: 'general' | 'advance';
  description: string;
  amount: number;
  paymentMode: 'cash' | 'gpay';
  addedBy: string;
  time: Date;
  employeeId?: string;
}

export interface AppState {
  screen: Screen;
  role?: Role;
  loggedInStylist?: Stylist;
  currentCustomer?: Customer;
  selectedStylist?: Stylist;
  closingSession?: Session;
  openingBalanceDone: boolean;
}
