// src/services/banService.js
import { supabase } from '../supabaseClient';

export const banService = {
  
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
        throw error;
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
      let { data: bansData, error: bansError, count } = await supabase
        .from('device_bans')
        .select(`
          *,
          ban_appeals(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, start + limit - 1);

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
          .select('id, full_name, email')
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

      // Gabungkan data bans dengan profiles
      const enrichedData = bansData.map(ban => {
        const userProfile = ban.user_id ? profilesData[ban.user_id] : null;
        const bannedByProfile = ban.banned_by ? profilesData[ban.banned_by] : null;
        
        return {
          ...ban,
          user: userProfile ? {
            email: userProfile.email,
            profiles: { full_name: userProfile.full_name }
          } : { email: 'N/A', profiles: { full_name: 'N/A' } },
          banned_by_user: bannedByProfile ? {
            email: bannedByProfile.email,
            profiles: { full_name: bannedByProfile.full_name }
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

  // ==================== GET BAN STATISTICS ====================
  async getBanStatistics() {
    try {
      console.log('📊 Fetching ban statistics...');
      
      // Get current date for calculations
      const now = new Date().toISOString();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      // Query untuk total active bans
      const { count: activeBansCount, error: activeError } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true })
        .or(`is_permanent.eq.true,and(banned_until.gt.${now},is_permanent.eq.false)`);

      if (activeError) {
        console.error('❌ Error counting active bans:', activeError);
        throw activeError;
      }

      // Query untuk total bans last month
      const { count: lastMonthCount, error: lastMonthError } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth.toISOString())
        .lt('created_at', now);

      // Query untuk pending appeals
      const { count: pendingAppealsCount, error: appealsError } = await supabase
        .from('ban_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('appeal_status', 'pending');

      // Query untuk today's appeals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayAppealsCount, error: todayError } = await supabase
        .from('ban_appeals')
        .select('*', { count: 'exact', head: true })
        .eq('appeal_status', 'pending')
        .gte('created_at', today.toISOString());

      // Query untuk permanent bans
      const { count: permanentBansCount, error: permanentError } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true })
        .eq('is_permanent', true);

      // Query untuk total users (from auth.users)
      const { count: totalUsersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Calculate percentage changes
      const currentMonthCount = activeBansCount || 0;
      const lastMonthTotal = lastMonthCount || 0;
      const percentageChange = lastMonthTotal > 0 
        ? Math.round(((currentMonthCount - lastMonthTotal) / lastMonthTotal) * 100)
        : 0;

      const permanentPercentage = totalUsersCount > 0
        ? ((permanentBansCount || 0) / totalUsersCount * 100).toFixed(1)
        : '0.0';

      // Calculate average ban duration (for temporary bans)
      const { data: tempBans, error: tempError } = await supabase
        .from('device_bans')
        .select('banned_at, banned_until')
        .eq('is_permanent', false)
        .not('banned_until', 'is', null);

      let avgDurationDays = 7; // default
      if (!tempError && tempBans && tempBans.length > 0) {
        const totalDays = tempBans.reduce((sum, ban) => {
          const start = new Date(ban.banned_at);
          const end = new Date(ban.banned_until);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          return sum + (days > 0 ? days : 0);
        }, 0);
        avgDurationDays = Math.round(totalDays / tempBans.length);
      }

      return {
        success: true,
        statistics: {
          totalBanned: activeBansCount || 0,
          percentageChange: percentageChange,
          pendingAppeals: pendingAppealsCount || 0,
          todayAppeals: todayAppealsCount || 0,
          permanentBans: permanentBansCount || 0,
          permanentPercentage: permanentPercentage,
          avgDurationDays: avgDurationDays,
          lastMonthChange: -2, // Hardcoded for now
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

  // ==================== BAN DEVICE ====================
  async banDevice(banData) {
    try {
      console.log('🔨 Banning device with data:', banData);
      
      // Cari user_id dari email jika tersedia
      let userId = banData.userId;
      if (!userId && banData.email) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', banData.email)
          .single();
        
        if (userData) {
          userId = userData.id;
        }
      }
      
      const { data, error } = await supabase
        .from('device_bans')
        .insert([{
          user_id: userId || null,
          device_fingerprint: banData.deviceFingerprint,
          ip_address: banData.ipAddress,
          user_agent: banData.userAgent,
          platform: banData.platform,
          browser: banData.browser,
          os: banData.os,
          screen_resolution: banData.screenResolution,
          languages: banData.languages,
          timezone: banData.timezone,
          banned_until: banData.bannedUntil,
          is_permanent: banData.isPermanent || false,
          reason: banData.reason || 'No reason provided',
          banned_by: banData.bannedBy || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error banning device:', error);
        throw error;
      }
      
      console.log('✅ Device banned successfully:', data);
      
      // Update user's profile dengan device info terakhir
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            last_device_fingerprint: banData.deviceFingerprint,
            last_ip_address: banData.ipAddress,
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
      
      const { error } = await supabase
        .from('device_bans')
        .update({ 
          banned_until: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', banId);

      if (error) {
        console.error('❌ Error unbanning device:', error);
        throw error;
      }
      
      console.log('✅ Device unbanned successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Fatal error in unbanDevice:', error);
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

      if (error) throw error;
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== GET ALL USERS (FOR ADMIN) ====================
  async getAllUsers(search = '', limit = 50) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        success: true,
        data: data || [],
        total: count || 0
      };
      
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== TEST CONNECTION ====================
  async testConnection() {
    try {
      // Test device_bans
      const { count: bansCount, error: bansError } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true });
      
      // Test profiles
      const { count: profilesCount, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (bansError || profilesError) {
        throw new Error(`Bans error: ${bansError?.message}, Profiles error: ${profilesError?.message}`);
      }
      
      console.log('✅ Database connection successful');
      console.log(`📊 Device bans: ${bansCount}, Profiles: ${profilesCount}`);
      
      return { 
        success: true, 
        bansCount: bansCount,
        profilesCount: profilesCount
      };
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return { success: false, error: error.message };
    }
  }
};
