// src/services/banService.js
import { supabase } from '../supabaseClient';

export const banService = {
  
  // ==================== GET CURRENT USER ID ====================
  async getCurrentUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // ==================== CHECK BAN STATUS ====================
  async checkDeviceBan(deviceFingerprint, email = null) {
    try {
      console.log('🔍 Checking ban for fingerprint:', deviceFingerprint);
      
      const now = new Date().toISOString();
      
      // Query untuk cek active bans
      const { data, error } = await supabase
        .from('device_bans')
        .select(`
          *,
          ban_appeals(*)
        `)
        .eq('device_fingerprint', deviceFingerprint)
        .or(`is_permanent.eq.true,and(banned_until.gt.${now},is_permanent.eq.false)`)
        .limit(1);

      if (error) {
        console.error('❌ Error checking ban:', error);
        return { isBanned: false, error: error.message };
      }
      
      console.log('📊 Ban check result:', data);
      
      if (data && data.length > 0) {
        const ban = data[0];
        const isActive = ban.is_permanent || new Date(ban.banned_until) > new Date();
        
        if (isActive) {
          return {
            isBanned: true,
            ban: ban,
            hasAppeal: ban.ban_appeals && ban.ban_appeals.length > 0,
            appeal: ban.ban_appeals?.[0],
          };
        }
      }
      
      return { isBanned: false };
      
    } catch (error) {
      console.error('❌ Fatal error in checkDeviceBan:', error);
      return { isBanned: false, error: error.message };
    }
  },

  // ==================== GET ALL BANS WITH USER PROFILES ====================
  async getAllBans(page = 1, limit = 10, filters = {}) {
    try {
      console.log('📋 Fetching bans with profiles...');
      
      const start = (page - 1) * limit;
      
      // Query utama untuk mendapatkan bans
      let query = supabase
        .from('device_bans')
        .select(`
          *,
          ban_appeals(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status === 'active') {
        const now = new Date().toISOString();
        query = query.or(`is_permanent.eq.true,and(banned_until.gt.${now},is_permanent.eq.false)`);
      } else if (filters.status === 'expired') {
        const now = new Date().toISOString();
        query = query.lt('banned_until', now).eq('is_permanent', false);
      } else if (filters.status === 'permanent') {
        query = query.eq('is_permanent', true);
      }

      if (filters.search) {
        query = query.or(`device_fingerprint.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`);
      }

      const { data: bansData, error: bansError, count } = await query.range(start, start + limit - 1);

      if (bansError) {
        console.error('❌ Error fetching bans:', bansError);
        throw bansError;
      }

      if (!bansData || bansData.length === 0) {
        console.log('📭 No bans found');
        return {
          success: true,
          data: [],
          total: 0,
          page,
          totalPages: 0,
        };
      }

      // Ambil semua user_id dari bans untuk query profiles
      const userIds = bansData
        .map(ban => ban.user_id)
        .filter(id => id)
        .concat(
          bansData.map(ban => ban.banned_by).filter(id => id)
        )
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      console.log('👥 User IDs to fetch:', userIds);

      // Query profiles untuk semua user
      let profilesData = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError);
        } else {
          // Convert to object for easy lookup
          profilesData = profiles?.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {}) || {};
        }
      }

      // Query auth.users untuk email (fallback)
      let authUsersData = {};
      if (userIds.length > 0) {
        const { data: authUsers, error: authError } = await supabase
          .from('auth.users')
          .select('id, email')
          .in('id', userIds);

        if (!authError && authUsers) {
          authUsers.forEach(user => {
            authUsersData[user.id] = user;
          });
        }
      }

      // Gabungkan data bans dengan profiles
      const enrichedData = bansData.map(ban => {
        const userProfile = ban.user_id ? (profilesData[ban.user_id] || authUsersData[ban.user_id]) : null;
        const bannedByProfile = ban.banned_by ? (profilesData[ban.banned_by] || authUsersData[ban.banned_by]) : null;
        
        return {
          ...ban,
          user: userProfile ? {
            email: userProfile.email || 'No email',
            profiles: { full_name: userProfile.full_name || 'N/A' }
          } : { email: 'N/A', profiles: { full_name: 'N/A' } },
          banned_by_user: bannedByProfile ? {
            email: bannedByProfile.email || 'No email',
            profiles: { full_name: bannedByProfile.full_name || 'N/A' }
          } : null
        };
      });

      console.log('✅ Enriched bans data:', enrichedData);

      return {
        success: true,
        data: enrichedData,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
      
    } catch (error) {
      console.error('❌ Fatal error in getAllBans:', error);
      return { 
        success: false, 
        error: error.message, 
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  },

  // ==================== BAN DEVICE ====================
  async banDevice(banData) {
    try {
      console.log('🔨 Banning device with data:', banData);
      
      // Dapatkan admin ID yang sedang login
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'Admin tidak terautentikasi' };
      }
      
      // Cari user_id dari email jika tersedia
      let userId = banData.userId;
      if (!userId && banData.email && banData.email !== 'Unknown') {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', banData.email)
          .single();
        
        if (!userError && userData) {
          userId = userData.id;
        }
      }
      
      const insertData = {
        user_id: userId || null,
        device_fingerprint: banData.deviceFingerprint || banData.deviceInfo?.fingerprint || 'unknown',
        ip_address: banData.ipAddress || banData.deviceInfo?.ipAddress || 'unknown',
        user_agent: banData.userAgent || banData.deviceInfo?.userAgent || navigator.userAgent,
        platform: banData.platform || banData.deviceInfo?.platform || 'unknown',
        browser: banData.browser || banData.deviceInfo?.browser || 'unknown',
        os: banData.os || banData.deviceInfo?.os || 'unknown',
        screen_resolution: banData.screenResolution || banData.deviceInfo?.screenResolution || 'unknown',
        languages: banData.languages || banData.deviceInfo?.languages || 'unknown',
        timezone: banData.timezone || banData.deviceInfo?.timezone || 'unknown',
        banned_until: banData.bannedUntil,
        is_permanent: banData.isPermanent || false,
        reason: banData.reason || 'No reason provided',
        banned_by: currentUserId, // Gunakan ID admin yang sedang login
      };

      console.log('📝 Insert ban data:', insertData);

      const { data, error } = await supabase
        .from('device_bans')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error banning device:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Device banned successfully:', data);
      
      // Update user's profile dengan device info terakhir
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            last_device_fingerprint: insertData.device_fingerprint,
            last_ip_address: insertData.ip_address,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Fatal error in banDevice:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== UNBAN DEVICE ====================
  async unbanDevice(banId) {
    try {
      console.log('🔓 Unbanning device ID:', banId);
      
      if (!banId) {
        return { success: false, error: 'Ban ID tidak valid' };
      }
      
      // Set banned_until ke waktu sekarang (segera berakhir)
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('device_bans')
        .update({ 
          banned_until: now,
          updated_at: now
        })
        .eq('id', banId);

      if (error) {
        console.error('❌ Error unbanning device:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Device unbanned successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Fatal error in unbanDevice:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== UPDATE APPEAL STATUS ====================
  async updateAppealStatus(appealId, status, adminResponse) {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return { success: false, error: 'Admin tidak terautentikasi' };
      }

      const { error } = await supabase
        .from('ban_appeals')
        .update({
          appeal_status: status,
          admin_response: adminResponse,
          responded_by: currentUserId,
          responded_at: new Date().toISOString(),
        })
        .eq('id', appealId);

      if (error) throw error;
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating appeal:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== LOGIN ATTEMPT ====================
  async logLoginAttempt(attemptData) {
    try {
      console.log('📋 Logging login attempt:', attemptData.email);
      
      const { error } = await supabase
        .from('login_attempts')
        .insert([{
          email: attemptData.email,
          device_fingerprint: attemptData.deviceFingerprint || 'unknown',
          ip_address: attemptData.ipAddress || 'unknown',
          user_agent: attemptData.userAgent || navigator.userAgent,
          success: attemptData.success || false,
        }]);

      if (error) {
        console.error('❌ Error logging attempt:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Login attempt logged');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error in logLoginAttempt:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== SUBMIT APPEAL ====================
  async submitAppeal(appealData) {
    try {
      console.log('📝 Submitting appeal:', appealData);
      
      const currentUserId = await this.getCurrentUserId();
      
      const { data, error } = await supabase
        .from('ban_appeals')
        .insert([{
          device_ban_id: appealData.deviceBanId,
          user_id: appealData.userId || currentUserId,
          appeal_message: appealData.message,
          appeal_status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error submitting appeal:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Appeal submitted successfully:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Fatal error in submitAppeal:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== GET BAN STATISTICS ====================
  async getBanStatistics() {
    try {
      console.log('📊 Fetching ban statistics...');
      
      const now = new Date().toISOString();
      
      // Total active bans
      const { count: activeBansCount, error: activeError } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true })
        .or(`is_permanent.eq.true,and(banned_until.gt.${now},is_permanent.eq.false)`);

      // Pending appeals
      const { count: pendingAppealsCount } = await supabase
        .from('ban_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('appeal_status', 'pending');

      // Today's appeals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayAppealsCount } = await supabase
        .from('ban_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('appeal_status', 'pending')
        .gte('created_at', today.toISOString());

      // Permanent bans
      const { count: permanentBansCount } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true })
        .eq('is_permanent', true);

      return {
        success: true,
        statistics: {
          totalBanned: activeBansCount || 0,
          percentageChange: 12, // Default
          pendingAppeals: pendingAppealsCount || 0,
          todayAppeals: todayAppealsCount || 0,
          permanentBans: permanentBansCount || 0,
          permanentPercentage: '0.5', // Default
          avgDurationDays: 7,
          lastMonthChange: -2,
        }
      };

    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      return {
        success: false,
        error: error.message,
        statistics: {
          totalBanned: 0,
          percentageChange: 0,
          pendingAppeals: 0,
          todayAppeals: 0,
          permanentBans: 0,
          permanentPercentage: '0.0',
          avgDurationDays: 7,
          lastMonthChange: 0,
        }
      };
    }
  },

  // ==================== TEST CONNECTION ====================
  async testConnection() {
    try {
      // Test device_bans
      const { count: bansCount, error: bansError } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true });
      
      if (bansError) {
        console.error('❌ Bans table error:', bansError);
      }
      
      console.log('✅ Database connection test');
      console.log(`📊 Device bans: ${bansCount || 0}`);
      
      return { 
        success: !bansError, 
        bansCount: bansCount || 0,
        error: bansError?.message
      };
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== GET USER BY EMAIL ====================
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .single();

      if (error) {
        // Coba dari auth.users
        const { data: authData, error: authError } = await supabase
          .from('auth.users')
          .select('id, email')
          .eq('email', email)
          .single();
          
        if (authError) throw authError;
        
        return { 
          success: true, 
          data: { id: authData.id, email: authData.email, full_name: authData.email }
        };
      }
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return { success: false, error: error.message };
    }
  }
};
