/**
 * Koharu Maps - Database Storage Engine with Native Supabase Support
 * Seamlessly interfaces with Supabase (PostgreSQL) when configured,
 * and falls back to resilient local JSON persistence during development/offline runs.
 */

import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  provider: 'local' | 'google' | 'discord' | 'github';
  providerId?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginIp?: string;
  lastLoginLocation?: string;
  lastLoginDevice?: string;
  lastLoginAt?: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string;
  name: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  title: string;
  category: string;
  address: string;
  lon: number;
  lat: number;
  memo?: string;
  createdAt: string;
}

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: User[];
  apiKeys: ApiKey[];
  favorites: Favorite[];
  verificationCodes: VerificationCode[];
}

let cache: DatabaseSchema = {
  users: [],
  apiKeys: [],
  favorites: [],
  verificationCodes: [],
};

let isInitialized = false;

function getDbPath(): string {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'koharu_maps_db.json');
  }
  const localDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(localDir)) {
    try {
      fs.mkdirSync(localDir, { recursive: true });
    } catch {}
  }
  return path.join(localDir, 'koharu_maps_db.json');
}

function loadDatabase(): DatabaseSchema {
  if (isInitialized) return cache;
  const dbPath = getDbPath();
  try {
    if (fs.existsSync(dbPath)) {
      cache = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } else {
      cache = { users: [], apiKeys: [], favorites: [], verificationCodes: [] };
      saveDatabase();
    }
  } catch {
    cache = { users: [], apiKeys: [], favorites: [], verificationCodes: [] };
  }
  isInitialized = true;
  return cache;
}

function saveDatabase(): void {
  const dbPath = getDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save database file:', e);
  }
}

export const db = {
  // 1. Users
  async getUserByEmail(email: string): Promise<User | undefined> {
    if (supabase) {
      const { data } = await supabase.from('users').select('*').eq('email', email.toLowerCase()).single();
      if (data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          name: data.name,
          provider: data.provider,
          providerId: data.provider_id,
          avatarUrl: data.avatar_url,
          lastLoginIp: data.last_login_ip,
          lastLoginLocation: data.last_login_location,
          lastLoginDevice: data.last_login_device,
          lastLoginAt: data.last_login_at,
          createdAt: data.created_at,
        };
      }
      return undefined;
    }
    loadDatabase();
    return cache.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  async getUserById(id: string): Promise<User | undefined> {
    if (supabase) {
      const { data } = await supabase.from('users').select('*').eq('id', id).single();
      if (data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash,
          name: data.name,
          provider: data.provider,
          providerId: data.provider_id,
          avatarUrl: data.avatar_url,
          lastLoginIp: data.last_login_ip,
          lastLoginLocation: data.last_login_location,
          lastLoginDevice: data.last_login_device,
          lastLoginAt: data.last_login_at,
          createdAt: data.created_at,
        };
      }
      return undefined;
    }
    loadDatabase();
    return cache.users.find(u => u.id === id);
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newId = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const nowIso = new Date().toISOString();

    const newUser: User = {
      ...userData,
      id: newId,
      createdAt: nowIso,
    };

    if (supabase) {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email.toLowerCase(),
        password_hash: newUser.passwordHash || null,
        name: newUser.name,
        provider: newUser.provider,
        provider_id: newUser.providerId || null,
        avatar_url: newUser.avatarUrl || null,
        created_at: newUser.createdAt,
      });
      return newUser;
    }

    loadDatabase();
    cache.users.push(newUser);
    saveDatabase();
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (supabase) {
      const pgUpdates: Record<string, any> = {};
      if (updates.name !== undefined) pgUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) pgUpdates.avatar_url = updates.avatarUrl;
      if (updates.lastLoginIp !== undefined) pgUpdates.last_login_ip = updates.lastLoginIp;
      if (updates.lastLoginLocation !== undefined) pgUpdates.last_login_location = updates.lastLoginLocation;
      if (updates.lastLoginDevice !== undefined) pgUpdates.last_login_device = updates.lastLoginDevice;
      if (updates.lastLoginAt !== undefined) pgUpdates.last_login_at = updates.lastLoginAt;

      await supabase.from('users').update(pgUpdates).eq('id', id);
      return this.getUserById(id);
    }

    loadDatabase();
    const idx = cache.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    cache.users[idx] = { ...cache.users[idx], ...updates };
    saveDatabase();
    return cache.users[idx];
  },

  async deleteUser(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      return !error;
    }
    loadDatabase();
    const initialLen = cache.users.length;
    cache.users = cache.users.filter(u => u.id !== id);
    cache.apiKeys = cache.apiKeys.filter(k => k.userId !== id);
    cache.favorites = cache.favorites.filter(f => f.userId !== id);
    saveDatabase();
    return cache.users.length < initialLen;
  },

  // 2. Verification Codes
  async saveVerificationCode(email: string, code: string, ttlSeconds: number = 600): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    if (supabase) {
      await supabase.from('verification_codes').upsert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt,
      });
      return;
    }

    loadDatabase();
    cache.verificationCodes = cache.verificationCodes.filter(c => c.email.toLowerCase() !== email.toLowerCase());
    cache.verificationCodes.push({
      email: email.toLowerCase(),
      code,
      expiresAt,
    });
    saveDatabase();
  },

  async verifyCode(email: string, code: string): Promise<boolean> {
    if (supabase) {
      const { data } = await supabase.from('verification_codes').select('*').eq('email', email.toLowerCase()).single();
      if (!data) return false;
      if (Date.now() > Number(data.expires_at)) return false;
      const isValid = data.code === code.trim();
      if (isValid) {
        await supabase.from('verification_codes').delete().eq('email', email.toLowerCase());
      }
      return isValid;
    }

    loadDatabase();
    const entry = cache.verificationCodes.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) return false;
    const isValid = entry.code === code.trim();
    if (isValid) {
      cache.verificationCodes = cache.verificationCodes.filter(c => c.email.toLowerCase() !== email.toLowerCase());
      saveDatabase();
    }
    return isValid;
  },

  // 3. API Keys
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    if (supabase) {
      const { data } = await supabase.from('api_keys').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (data || []).map(k => ({
        id: k.id,
        userId: k.user_id,
        key: k.key,
        name: k.name,
        usageCount: k.usage_count,
        isActive: k.is_active,
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at,
      }));
    }

    loadDatabase();
    return cache.apiKeys.filter(k => k.userId === userId);
  },

  async getApiKey(keyToken: string): Promise<ApiKey | undefined> {
    if (supabase) {
      const { data } = await supabase.from('api_keys').select('*').eq('key', keyToken).eq('is_active', true).single();
      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          key: data.key,
          name: data.name,
          usageCount: data.usage_count,
          isActive: data.is_active,
          createdAt: data.created_at,
          lastUsedAt: data.last_used_at,
        };
      }
      return undefined;
    }

    loadDatabase();
    return cache.apiKeys.find(k => k.key === keyToken && k.isActive);
  },

  async createApiKey(userId: string, name: string): Promise<ApiKey> {
    const randPart = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    const newKey: ApiKey = {
      id: 'key_' + Date.now().toString(36),
      userId,
      key: `kmap_live_${randPart}`,
      name,
      usageCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      await supabase.from('api_keys').insert({
        id: newKey.id,
        user_id: newKey.userId,
        key: newKey.key,
        name: newKey.name,
        usage_count: 0,
        is_active: true,
        created_at: newKey.createdAt,
      });
      return newKey;
    }

    loadDatabase();
    cache.apiKeys.push(newKey);
    saveDatabase();
    return newKey;
  },

  async incrementKeyUsage(keyId: string): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase.rpc('increment_api_key_usage', { target_key_id: keyId });
        if (error) {
          const { data } = await supabase.from('api_keys').select('usage_count').eq('id', keyId).single();
          if (data) {
            await supabase.from('api_keys').update({
              usage_count: (data.usage_count || 0) + 1,
              last_used_at: new Date().toISOString(),
            }).eq('id', keyId);
          }
        }
      } catch {
        // Ignored
      }
      return;
    }

    loadDatabase();
    const key = cache.apiKeys.find(k => k.id === keyId);
    if (key) {
      key.usageCount += 1;
      key.lastUsedAt = new Date().toISOString();
      saveDatabase();
    }
  },

  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('api_keys').delete().eq('id', keyId).eq('user_id', userId);
      return !error;
    }

    loadDatabase();
    const idx = cache.apiKeys.findIndex(k => k.id === keyId && k.userId === userId);
    if (idx === -1) return false;
    cache.apiKeys.splice(idx, 1);
    saveDatabase();
    return true;
  },

  // 4. Favorites
  async getFavoritesByUserId(userId: string): Promise<Favorite[]> {
    if (supabase) {
      const { data } = await supabase.from('favorites').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (data || []).map(f => ({
        id: f.id,
        userId: f.user_id,
        title: f.title,
        category: f.category,
        address: f.address,
        lon: f.lon,
        lat: f.lat,
        memo: f.memo,
        createdAt: f.created_at,
      }));
    }

    loadDatabase();
    return cache.favorites.filter(f => f.userId === userId).reverse();
  },

  async addFavorite(data: Omit<Favorite, 'id' | 'createdAt'>): Promise<Favorite> {
    const fav: Favorite = {
      ...data,
      id: 'fav_' + Math.random().toString(36).substring(2, 10),
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      await supabase.from('favorites').insert({
        id: fav.id,
        user_id: fav.userId,
        title: fav.title,
        category: fav.category,
        address: fav.address,
        lon: fav.lon,
        lat: fav.lat,
        memo: fav.memo || null,
        created_at: fav.createdAt,
      });
      return fav;
    }

    loadDatabase();
    cache.favorites.push(fav);
    saveDatabase();
    return fav;
  },

  async deleteFavorite(favId: string, userId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('favorites').delete().eq('id', favId).eq('user_id', userId);
      return !error;
    }

    loadDatabase();
    const idx = cache.favorites.findIndex(f => f.id === favId && f.userId === userId);
    if (idx === -1) return false;
    cache.favorites.splice(idx, 1);
    saveDatabase();
    return true;
  },
};
