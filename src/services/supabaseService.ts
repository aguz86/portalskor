import { supabase } from '../supabase';
import { Match, Prediction, UserProfile, Withdrawal } from '../types';

export const supabaseService = {
  // Auth
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (error) {
      console.error('Error fetching user profile from Supabase:', error);
      return null;
    }
    return data as UserProfile;
  },

  // Matches
  async getOpenMatches(): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'open');
    
    if (error) {
      console.error('Error fetching matches from Supabase:', error);
      return [];
    }
    return (data as any[]).map(m => ({
      id: m.id,
      teamA: m.teamA,
      logoA: m.logoA,
      teamB: m.teamB,
      logoB: m.logoB,
      status: m.status,
      resultA: m.resultA,
      resultB: m.resultB,
      deadline: m.deadline,
      totalPrize: m.totalPrize,
      winnerCount: m.winnerCount,
      created_at: m.created_at
    })) as Match[];
  },

  async getAllMatches(): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all matches from Supabase:', error);
      return [];
    }
    return (data as any[]).map(m => ({
      id: m.id,
      teamA: m.teamA,
      logoA: m.logoA,
      teamB: m.teamB,
      logoB: m.logoB,
      status: m.status,
      resultA: m.resultA,
      resultB: m.resultB,
      deadline: m.deadline,
      totalPrize: m.totalPrize,
      winnerCount: m.winnerCount,
      created_at: m.created_at
    })) as Match[];
  },

  async createMatch(match: Omit<Match, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('matches')
      .insert([{
        teamA: match.teamA,
        logoA: match.logoA,
        teamB: match.teamB,
        logoB: match.logoB,
        status: match.status,
        deadline: match.deadline,
        totalPrize: match.totalPrize,
        winnerCount: match.winnerCount,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error creating match in Supabase:', error);
      return false;
    }
    return true;
  },

  async updateMatch(id: string, updates: Partial<Match>): Promise<boolean> {
    const mappedUpdates: any = {};
    if (updates.teamA !== undefined) mappedUpdates.teamA = updates.teamA;
    if (updates.logoA !== undefined) mappedUpdates.logoA = updates.logoA;
    if (updates.teamB !== undefined) mappedUpdates.teamB = updates.teamB;
    if (updates.logoB !== undefined) mappedUpdates.logoB = updates.logoB;
    if (updates.status !== undefined) mappedUpdates.status = updates.status;
    if (updates.resultA !== undefined) mappedUpdates.resultA = updates.resultA;
    if (updates.resultB !== undefined) mappedUpdates.resultB = updates.resultB;
    if (updates.deadline !== undefined) mappedUpdates.deadline = updates.deadline;
    if (updates.totalPrize !== undefined) mappedUpdates.totalPrize = updates.totalPrize;
    if (updates.winnerCount !== undefined) mappedUpdates.winnerCount = updates.winnerCount;

    const { error } = await supabase
      .from('matches')
      .update(mappedUpdates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating match in Supabase:', error);
      return false;
    }
    return true;
  },

  // Predictions
  async getPredictions(userId: string): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching predictions from Supabase:', error);
      return [];
    }
    return (data as any[]).map(p => ({
      id: p.id,
      userId: p.userId,
      matchId: p.matchId,
      scoreA: p.scoreA,
      scoreB: p.scoreB,
      status: p.status,
      created_at: p.created_at
    })) as Prediction[];
  },

  async getAllPredictions(): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all predictions from Supabase:', error);
      return [];
    }
    return (data as any[]).map(p => ({
      id: p.id,
      userId: p.userId,
      matchId: p.matchId,
      scoreA: p.scoreA,
      scoreB: p.scoreB,
      status: p.status,
      created_at: p.created_at
    })) as Prediction[];
  },

  async getMatchPredictions(matchId: string): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('matchId', matchId);
    
    if (error) {
      console.error('Error fetching match predictions from Supabase:', error);
      return [];
    }
    return (data as any[]).map(p => ({
      id: p.id,
      userId: p.userId,
      matchId: p.matchId,
      scoreA: p.scoreA,
      scoreB: p.scoreB,
      status: p.status,
      created_at: p.created_at
    })) as Prediction[];
  },

  async createPrediction(prediction: Omit<Prediction, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('predictions')
      .insert([{
        userId: prediction.userId,
        matchId: prediction.matchId,
        scoreA: prediction.scoreA,
        scoreB: prediction.scoreB,
        status: prediction.status,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error creating prediction in Supabase:', error);
      return false;
    }
    return true;
  },

  async updatePrediction(id: string, updates: Partial<Prediction>): Promise<boolean> {
    const mappedUpdates: any = {};
    if (updates.userId !== undefined) mappedUpdates.userId = updates.userId;
    if (updates.matchId !== undefined) mappedUpdates.matchId = updates.matchId;
    if (updates.scoreA !== undefined) mappedUpdates.scoreA = updates.scoreA;
    if (updates.scoreB !== undefined) mappedUpdates.scoreB = updates.scoreB;
    if (updates.status !== undefined) mappedUpdates.status = updates.status;

    const { error } = await supabase
      .from('predictions')
      .update(mappedUpdates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating prediction in Supabase:', error);
      return false;
    }
    return true;
  },

  // Withdrawals
  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching withdrawals from Supabase:', error);
      return [];
    }
    return (data as any[]).map(w => ({
      id: w.id,
      userId: w.userId,
      amount: w.amount,
      status: w.status,
      created_at: w.created_at
    })) as Withdrawal[];
  },

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all withdrawals from Supabase:', error);
      return [];
    }
    return (data as any[]).map(w => ({
      id: w.id,
      userId: w.userId,
      amount: w.amount,
      wallet: w.wallet,
      status: w.status,
      created_at: w.created_at
    })) as Withdrawal[];
  },

  async createWithdrawal(withdrawal: Omit<Withdrawal, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('withdrawals')
      .insert([{
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        wallet: withdrawal.wallet,
        status: withdrawal.status,
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error creating withdrawal in Supabase:', error);
      return false;
    }
    return true;
  },

  async updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<boolean> {
    const mappedUpdates: any = {};
    if (updates.userId !== undefined) mappedUpdates.userId = updates.userId;
    if (updates.amount !== undefined) mappedUpdates.amount = updates.amount;
    if (updates.status !== undefined) mappedUpdates.status = updates.status;

    const { error } = await supabase
      .from('withdrawals')
      .update(mappedUpdates)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating withdrawal in Supabase:', error);
      return false;
    }
    return true;
  },

  // OTPs
  async createOtp(email: string, code: string): Promise<boolean> {
    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + 10); // Valid for 10 minutes
    const { error } = await supabase
      .from('otps')
      .insert([{
        email,
        code,
        expires_at: expires_at.toISOString()
      }]);
    
    if (error) {
      console.error('Error creating OTP:', error);
      return false;
    }
    return true;
  },

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const { data: otps, error } = await supabase
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }

    if (otps && otps.length > 0) {
      // Mark as used
      await supabase
        .from('otps')
        .update({ used: true })
        .eq('id', otps[0].id);
      return true;
    }

    return false;
  },

  // Users
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching all users from Supabase:', error);
      return [];
    }
    return data as UserProfile[];
  },

  async updateUserBalance(uid: string, balance: number): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ balance })
      .eq('uid', uid);
    
    if (error) {
      console.error('Error updating user balance in Supabase:', error);
      return false;
    }
    return true;
  },

  // Settings
  async getConfig(): Promise<any | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'config')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching config from Supabase:', error);
      return null;
    }
    return {
      id: data.id,
      webName: data.webname,
      adminEmail: data.adminemail,
      adminPassword: data.adminpassword,
      isInstalled: data.isinstalled,
      installedAt: data.installedat,
      logoUrl: data.logo_url,
      youtubeUrl: data.youtube_url,
      facebookUrl: data.facebook_url,
      instagramUrl: data.instagram_url,
      tiktokUrl: data.tiktok_url
    };
  },

  async saveConfig(config: any): Promise<boolean> {
    const { error } = await supabase
      .from('settings')
      .upsert([{ 
        id: 'config', 
        webname: config.webName,
        adminemail: config.adminEmail,
        adminpassword: config.adminPassword,
        isinstalled: config.isInstalled,
        installedat: config.installedAt,
        logo_url: config.logoUrl,
        youtube_url: config.youtubeUrl,
        facebook_url: config.facebookUrl,
        instagram_url: config.instagramUrl,
        tiktok_url: config.tiktokUrl
      }]);
    
    if (error) {
      console.error('Error saving config to Supabase:', error);
      let errorMessage = error.message;
      if (errorMessage?.includes('Failed to fetch')) {
        throw new Error('Supabase Error: Gagal terhubung ke database. Pastikan VITE_SUPABASE_URL sudah diisi dengan benar (menggunakan url https://...) dan Anda telah menjalankan script database.sql di Supabase SQL Editor.');
      }
      throw new Error(`Supabase Error: ${errorMessage} (${error.code})`);
    }
    return true;
  }
};
