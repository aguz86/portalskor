export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  balance: number;
}

export interface Match {
  id: string;
  teamA: string;
  logoA?: string;
  teamB: string;
  logoB?: string;
  status: 'open' | 'closed';
  resultA?: number;
  resultB?: number;
  deadline: any;
  totalPrize: number;
  winnerCount: number;
  created_at?: any;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  scoreA: number;
  scoreB: number;
  status: 'pending' | 'won' | 'lost';
  created_at?: any;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: any;
}
