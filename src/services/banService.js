// src/services/banService.js
import { supabase } from '../supabaseClient';

export const banService = {
  
  // ==================== UTILITY FUNCTIONS ====================
  
  async getCurrentUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async getCurrentUserEmail() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email || null;
    } catch (error) {
      console.error('Error getting current user email:', error);
      return null;
    }
  },

  // ==================== DEVICE TRACKING ====================
  
  async trackDeviceLogin(deviceData) {
    try {
      console.log('📱 Tracking device login:', deviceData.email);
      
      const now = new Date().toISOString();
      const userId = deviceData.userId || null;
      
      // Cek apakah device sudah pernah terdaftar
      const { data: existingDevice, error: checkError } = await supabase
        .from('user_devices')
        .select('*')
        .eq('device_fingerprint', deviceData.deviceFingerprint)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking existing device:', checkError);
      }

      let result;
      
      if (existingDevice) {
        // Update existing device
        result = await supabase
          .from('user_devices')
          .update({
            last_seen_at: now,
            login_count: (existingDevice.login_count || 0) + 1,
            is_current: true,
            ip_address: deviceData.ipAddress,
            user_agent: deviceData.userAgent,
            updated_at: now
          })
          .eq('id', existingDevice.id)
          .select()
          .single();
          
        console.log('✅ Updated existing device');
      } else {
        // Insert new device
        result = await supabase
          .from('user_devices')
          .insert([{
            user_id: userId,
            email: deviceData.email,
            device_fingerprint: deviceData.deviceFingerprint,
            device_name: this.generateDeviceName(deviceData),
            ip_address: deviceData.ipAddress,
            user_agent: deviceData.userAgent,
            platform: deviceData.platform,
            browser: deviceData.browser,
            os: deviceData.os,
            screen_resolution: deviceData.screenResolution,
            languages: deviceData.languages,
            timezone: deviceData.timezone,
            first_seen_at: now,
            last_seen_at: now,
            login_count: 1,
            is_current: true
          }])
          .select()
          .single();
          
        console.log('✅ Added new device');
      }

      if (result.error) {
        console.error('❌ Error tracking device:', result.error);
        return { success: false, error: result.error.message };
      }

      // Reset is_current untuk device lain user yang sama
      if (userId) {
        await supabase
          .from('user_devices')
          .update({ is_current: false })
          .eq('user_id', userId)
          .neq('device_fingerprint', deviceData.deviceFingerprint);
      }

      return { 
        success: true, 
        data: result.data,
        isNewDevice: !existingDevice 
      };
      
    } catch (error) {
      console.error('❌ Fatal error in trackDeviceLogin:', error);
      return { success: false, error: error.message };
    }
  },

  generateDeviceName(deviceData) {
    const browser = deviceData.browser || 'Browser';
    const os = deviceData.os || 'OS';
    const platform = deviceData.platform || 'Device';
    
    if (platform.includes('Windows')) {
      return `${browser} on Windows`;
    } else if (platform.includes('Mac')) {
      return `${browser} on Mac`;
    } else if (platform.includes('Linux')) {
      return `${browser} on Linux`;
    } else if (platform.includes('Android')) {
      return `${browser} on Android`;
    } else if (platform.includes('iOS') || platform.includes('iPhone') || platform.includes('iPad')) {
      return `${browser} on iOS`;
    } else {
      return `${browser} on ${platform}`;
    }
  },

  // ==================== LOGIN ATTEMPT LOGGING ====================
  
  async logLoginAttempt(attemptData) {
    try {
      console.log('📋 Logging login attempt:', attemptData.email);
      
      const logData = {
        email: attemptData.email,
        user_id: attemptData.userId || null,
        device_fingerprint: attemptData.deviceFingerprint || 'unknown',
        ip_address: attemptData.ipAddress || 'unknown',
        user_agent: attemptData.userAgent || navigator.userAgent,
        action_type: attemptData.actionType || 'login',
        success: attemptData.success || false,
        error_message: attemptData.errorMessage || null
      };

      const { error } = await supabase
        .from('login_attempts')
        .insert([logData]);

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

  // ==================== BAN MANAGEMENT ====================
  
  async checkDeviceBan(deviceFingerprint, email = null) {
    try {
      console.log('🔍 Checking ban for fingerprint:', deviceFingerprint);
      
      const now = new Date().toISOString();
      
      // Query untuk cek active bans
      let query = supabase
        .from('device_bans')
        .select(`
          *,
          ban_appeals(*)
        `)
        .or(`device_fingerprint.eq.${deviceFingerprint}${email ? `,email.eq.${email}` : ''}`)
        .or(`is_permanent.eq.true,and(banned_until.gt.${now},is_permanent.eq.false)`)
        .limit(1);

      const { data, error } = await query;

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

  async banDevice(banData) {
    try {
      console.log('🔨 Banning device with data:', banData);
      
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId && banData.bannedBy) {
        console.log('⚠️ Using provided bannedBy ID:', banData.bannedBy);
      }
      
      // Cari user_id dari email jika tersedia
      let userId = banData.userId;
      if (!userId && banData.email && banData.email !== 'N/A') {
        const { data: userData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', banData.email)
          .maybeSingle();
        
        if (userData) {
          userId = userData.id;
        }
      }
      
      const insertData = {
        user_id: userId || null,
        device_fingerprint: banData.deviceFingerprint,
        email: banData.email || 'unknown@example.com',
        ip_address: banData.ipAddress || 'unknown',
        user_agent: banData.userAgent || 'unknown',
        platform: banData.platform || 'unknown',
        browser: banData.browser || 'unknown',
        os: banData.os || 'unknown',
        screen_resolution: banData.screenResolution || 'unknown',
        languages: banData.languages || 'unknown',
        timezone: banData.timezone || 'unknown',
        banned_until: banData.bannedUntil,
        is_permanent: banData.isPermanent || false,
        reason: banData.reason || 'No reason provided',
        banned_by: banData.bannedBy || currentUserId || null,
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

  // ==================== DATA FETCHING ====================
  
  async getAllBans(page = 1, limit = 10, filters = {}) {
    try {
      console.log('📋 Fetching bans with profiles...');
      
      const start = (page - 1) * limit;
      
      // Query utama untuk mendapatkan bans
      let query = supabase
        .from('device_bans')
        .select(`
          *,
          ban_appeals(*),
          banned_by_user:profiles!banned_by(full_name, email)
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
        query = query.or(`device_fingerprint.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%,reason.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
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
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      console.log('👥 User IDs to fetch:', userIds);

      // Query profiles untuk semua user
      let profilesData = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
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
        
        return {
          ...ban,
          user: userProfile ? {
            email: userProfile.email || ban.email,
            profiles: { full_name: userProfile.full_name || 'N/A' }
          } : { 
            email: ban.email || 'N/A', 
            profiles: { full_name: 'N/A' } 
          }
        };
      });

      console.log('✅ Enriched bans data count:', enrichedData.length);

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

  async getAllUserDevices(page = 1, limit = 10, filters = {}) {
    try {
      const start = (page - 1) * limit;
      
      let query = supabase
        .from('user_devices')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `, { count: 'exact' })
        .order('last_seen_at', { ascending: false });

      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,device_fingerprint.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`);
      }

      if (filters.email) {
        query = query.eq('email', filters.email);
      }

      const { data, error, count } = await query.range(start, start + limit - 1);

      if (error) {
        console.error('❌ Error fetching user devices:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
      
    } catch (error) {
      console.error('❌ Fatal error in getAllUserDevices:', error);
      return { 
        success: false, 
        error: error.message,
        data: [],
        total: 0
      };
    }
  },

  // ==================== APPEAL MANAGEMENT ====================
  
  async submitAppeal(appealData) {
    try {
      console.log('📝 Submitting appeal:', appealData);
      
      const { data, error } = await supabase
        .from('ban_appeals')
        .insert([{
          device_ban_id: appealData.deviceBanId,
          user_id: appealData.userId,
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

  async updateAppealStatus(appealId, status, adminResponse) {
    try {
      const currentUserId = await this.getCurrentUserId();

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

  // ==================== STATISTICS ====================
  
  async getBanStatistics() {
    try {
      console.log('📊 Fetching ban statistics...');
      
      const now = new Date().toISOString();
      
      // Total active bans
      const { count: activeBansCount } = await supabase
        .from('device_bans')
        .select('*', { count: 'exact', head: true })
        .or(`is_permanent.eq.true,and(banned_until.gt.${now},is_permanent.eq.false)`);

      // Total user devices
      const { count: totalDevicesCount } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true });

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

      // Recent login attempts
      const { count: recentLoginsCount } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      return {
        success: true,
        statistics: {
          totalBanned: activeBansCount || 0,
          totalDevices: totalDevicesCount || 0,
          pendingAppeals: pendingAppealsCount || 0,
          todayAppeals: todayAppealsCount || 0,
          permanentBans: permanentBansCount || 0,
          recentLogins: recentLoginsCount || 0,
          percentageChange: 12,
          permanentPercentage: '0.5',
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
          totalDevices: 0,
          pendingAppeals: 0,
          todayAppeals: 0,
          permanentBans: 0,
          recentLogins: 0,
          percentageChange: 0,
          permanentPercentage: '0.0',
          avgDurationDays: 7,
          lastMonthChange: 0,
        }
      };
    }
  },

  // ==================== TEST FUNCTIONS ====================
  
  async testConnection() {
    try {
      // Test semua tabel
      const tables = ['user_devices', 'device_bans', 'ban_appeals', 'login_attempts', 'profiles'];
      const results = {};
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        results[table] = {
          count: count || 0,
          error: error?.message
        };
      }
      
      console.log('✅ Database connection test results:', results);
      
      return { 
        success: true, 
        results 
      };
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== USER MANAGEMENT ====================
  
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

  async getUserDevices(userId) {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      
      return { success: true, data: data || [] };
      
    } catch (error) {
      console.error('❌ Error getting user devices:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== DEVICE INFO ====================
  
  async getDeviceInfo(deviceFingerprint) {
    try {
      const { data, error } = await supabase
        .from('user_devices')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
        .eq('device_fingerprint', deviceFingerprint)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Jika tidak ditemukan di user_devices, coba di device_bans
        const { data: banData } = await supabase
          .from('device_bans')
          .select('*')
          .eq('device_fingerprint', deviceFingerprint)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (banData) {
          return { success: true, data: banData, source: 'bans' };
        }
        
        throw new Error('Device not found');
      }
      
      return { success: true, data, source: 'user_devices' };
      
    } catch (error) {
      console.error('❌ Error getting device info:', error);
      return { success: false, error: error.message };
    }
  }
};
