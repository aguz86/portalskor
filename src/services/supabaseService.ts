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
      teamA: m.teamA || m.teama,
      logoA: m.logoA || m.logoa,
      teamB: m.teamB || m.teamb,
      logoB: m.logoB || m.logob,
      status: m.status,
      resultA: m.resultA || m.resulta,
      resultB: m.resultB || m.resultb,
      deadline: m.deadline,
      totalPrize: m.totalPrize || m.totalprize,
      winnerCount: m.winnerCount || m.winnercount,
      prizeDistribution: m.prizeDistribution || m.prizedistribution,
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
      teamA: m.teamA || m.teama,
      logoA: m.logoA || m.logoa,
      teamB: m.teamB || m.teamb,
      logoB: m.logoB || m.logob,
      status: m.status,
      resultA: m.resultA || m.resulta,
      resultB: m.resultB || m.resultb,
      deadline: m.deadline,
      totalPrize: m.totalPrize || m.totalprize,
      winnerCount: m.winnerCount || m.winnercount,
      prizeDistribution: m.prizeDistribution || m.prizedistribution,
      created_at: m.created_at
    })) as Match[];
  },

  async createMatch(match: Omit<Match, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('matches')
      .insert([{
        teama: match.teamA,
        logoa: match.logoA,
        teamb: match.teamB,
        logob: match.logoB,
        status: match.status,
        deadline: match.deadline,
        totalprize: match.totalPrize,
        winnercount: match.winnerCount,
        prizedistribution: match.prizeDistribution || 'rata',
        created_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error('Error creating match in Supabase:', error);
      throw error;
    }
    return true;
  },

  async updateMatch(id: string, updates: Partial<Match>): Promise<boolean> {
    const mappedUpdates: any = {};
    if (updates.teamA !== undefined) mappedUpdates.teama = updates.teamA;
    if (updates.logoA !== undefined) mappedUpdates.logoa = updates.logoA;
    if (updates.teamB !== undefined) mappedUpdates.teamb = updates.teamB;
    if (updates.logoB !== undefined) mappedUpdates.logob = updates.logoB;
    if (updates.status !== undefined) mappedUpdates.status = updates.status;
    if (updates.resultA !== undefined) mappedUpdates.resulta = updates.resultA;
    if (updates.resultB !== undefined) mappedUpdates.resultb = updates.resultB;
    if (updates.deadline !== undefined) mappedUpdates.deadline = updates.deadline;
    if (updates.totalPrize !== undefined) mappedUpdates.totalprize = updates.totalPrize;
    if (updates.winnerCount !== undefined) mappedUpdates.winnercount = updates.winnerCount;
    if (updates.prizeDistribution !== undefined) mappedUpdates.prizedistribution = updates.prizeDistribution;

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
      .eq('userid', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching predictions from Supabase:', error);
      return [];
    }
    return (data as any[]).map(p => ({
      id: p.id,
      userId: p.userId || p.userid,
      matchId: p.matchId || p.matchid,
      scoreA: p.scoreA || p.scorea,
      scoreB: p.scoreB || p.scoreb,
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
      userId: p.userId || p.userid,
      matchId: p.matchId || p.matchid,
      scoreA: p.scoreA || p.scorea,
      scoreB: p.scoreB || p.scoreb,
      status: p.status,
      created_at: p.created_at
    })) as Prediction[];
  },

  async getMatchPredictions(matchId: string): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('matchid', matchId);
    
    if (error) {
      console.error('Error fetching match predictions from Supabase:', error);
      return [];
    }
    return (data as any[]).map(p => ({
      id: p.id,
      userId: p.userId || p.userid,
      matchId: p.matchId || p.matchid,
      scoreA: p.scoreA || p.scorea,
      scoreB: p.scoreB || p.scoreb,
      status: p.status,
      created_at: p.created_at
    })) as Prediction[];
  },

  async createPrediction(prediction: Omit<Prediction, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('predictions')
      .insert([{
        userid: prediction.userId,
        matchid: prediction.matchId,
        scorea: prediction.scoreA,
        scoreb: prediction.scoreB,
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
    if (updates.userId !== undefined) mappedUpdates.userid = updates.userId;
    if (updates.matchId !== undefined) mappedUpdates.matchid = updates.matchId;
    if (updates.scoreA !== undefined) mappedUpdates.scorea = updates.scoreA;
    if (updates.scoreB !== undefined) mappedUpdates.scoreb = updates.scoreB;
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
      .eq('userid', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching withdrawals from Supabase:', error);
      return [];
    }
    return (data as any[]).map(w => ({
      id: w.id,
      userId: w.userId || w.userid,
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
      userId: w.userId || w.userid,
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
        userid: withdrawal.userId,
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
    if (updates.userId !== undefined) mappedUpdates.userid = updates.userId;
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
      // For any other error (like RLS or timeout), we throw it so the caller knows it's not a missing config
      throw error;
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
      tiktokUrl: data.tiktok_url,
      bannerImageUrl: data.banner_image_url,
      bannerLinkUrl: data.banner_link_url
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
        tiktok_url: config.tiktokUrl,
        banner_image_url: config.bannerImageUrl,
        banner_link_url: config.bannerLinkUrl
      }]);
    
    if (error) {
      console.error('Error saving config to Supabase:', error);
      let errorMessage = error.message;
      if (errorMessage?.includes('Failed to fetch') || errorMessage?.includes('SecurityError')) {
        throw new Error('Supabase Error: Gagal terhubung ke database atau permintaan ditolak. Pastikan VITE_SUPABASE_URL valid (menggunakan https://...) dan Anda telah menjalankan script database. Jika Anda menggunakan Safari atau melihat ini di iframe, coba buka aplikasi di tab baru (Open in New Tab).');
      }
      throw new Error(`Supabase Error: ${errorMessage} (${error?.code || 'Unknown'})`);
    }
    return true;
  },

  // Audit Logs
  async getAuditLogs(): Promise<import('../types').AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data as import('../types').AuditLog[];
  },

  async createAuditLog(action: string, details: string, adminEmail: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          action,
          details,
          admin_email: adminEmail
        }]);

      if (error) {
        console.error('Error creating audit log:', error);
        return false;
      }
      return true;
    } catch (error) {
      // Ignore if table doesn't exist yet
      console.error('Error creating audit log:', error);
      return false;
    }
  }
};
