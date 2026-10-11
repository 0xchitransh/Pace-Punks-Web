import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const DATA_DIR = path.join(process.cwd(), "data");
const WAITLIST_FILE = path.join(DATA_DIR, "waitlist.json");
const LEADERBOARD_FILE = path.join(DATA_DIR, "leaderboard.json");

/* =========================================================================
   1. WAITLIST TABLE (HOME PAGE)
   ========================================================================= */

export interface WaitlistEntry {
  id: string;
  email: string;
  walletAddress?: string;
  queueNumber: number;
  createdAt: string;
  userAgent?: string;
  ip?: string;
}

function ensureWaitlistFile(): WaitlistEntry[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WAITLIST_FILE)) {
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(WAITLIST_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveWaitlistFile(entries: WaitlistEntry[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function addWaitlistEntry({
  email,
  walletAddress,
  userAgent,
  ip,
}: {
  email: string;
  walletAddress?: string;
  userAgent?: string;
  ip?: string;
}): Promise<{ entry: WaitlistEntry; isNew: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("waitlist")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existing) {
        return {
          entry: {
            id: existing.id,
            email: existing.email,
            walletAddress: existing.wallet_address,
            queueNumber: existing.queue_number,
            createdAt: existing.created_at,
          },
          isNew: false,
        };
      }

      const { count } = await supabase
        .from("waitlist")
        .select("*", { count: "exact", head: true });

      const nextQueue = (count || 0) + 1420;

      const { data: inserted } = await supabase
        .from("waitlist")
        .insert({
          email: normalizedEmail,
          wallet_address: walletAddress || null,
          queue_number: nextQueue,
          ip: ip || null,
          user_agent: userAgent || null,
        })
        .select()
        .single();

      if (inserted) {
        return {
          entry: {
            id: inserted.id,
            email: inserted.email,
            walletAddress: inserted.wallet_address,
            queueNumber: inserted.queue_number,
            createdAt: inserted.created_at,
          },
          isNew: true,
        };
      }
    } catch (err) {
      console.error("Supabase waitlist error, falling back to local file:", err);
    }
  }

  const list = ensureWaitlistFile();
  const existing = list.find((item) => item.email === normalizedEmail);
  if (existing) {
    return { entry: existing, isNew: false };
  }

  const nextQueueNumber = 1420 + list.length + 1;
  const newEntry: WaitlistEntry = {
    id: `wl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    walletAddress,
    queueNumber: nextQueueNumber,
    createdAt: new Date().toISOString(),
    userAgent,
    ip,
  };

  list.push(newEntry);
  saveWaitlistFile(list);

  return { entry: newEntry, isNew: true };
}

export async function getWaitlistEntry(email: string): Promise<WaitlistEntry | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (supabase) {
    try {
      const { data } = await supabase
        .from("waitlist")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          email: data.email,
          walletAddress: data.wallet_address,
          queueNumber: data.queue_number,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.error("Supabase waitlist query error:", err);
    }
  }

  const list = ensureWaitlistFile();
  return list.find((item) => item.email === normalizedEmail) || null;
}

/* =========================================================================
   2. GAME LEADERBOARD TABLE (CORRIDOR RUN)
   ========================================================================= */

export interface LeaderboardEntry {
  id: string;
  username: string;
  email: string;
  score: number;
  bestScore: number;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

export interface PublicLeaderboardItem {
  rank: number;
  username: string;
  score: number;
  createdAt: string;
}

function ensureLeaderboardFile(): LeaderboardEntry[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2), "utf-8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(LEADERBOARD_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveLeaderboardFile(entries: LeaderboardEntry[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function submitLeaderboardScore({
  username,
  email,
  score,
  ip,
  userAgent,
}: {
  username: string;
  email: string;
  score: number;
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  username: string;
  score: number;
  bestScore: number;
  rank: number;
  totalPlayers: number;
  isNewBest: boolean;
}> {
  const cleanUser = username.trim().slice(0, 16);
  const normalizedEmail = email.trim().toLowerCase();
  const numScore = Math.max(0, Math.floor(score));

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("game_leaderboard")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      let bestScore = numScore;
      let isNewBest = true;

      if (existing) {
        bestScore = Math.max(existing.best_score, numScore);
        isNewBest = numScore > existing.best_score;

        await supabase
          .from("game_leaderboard")
          .update({
            username: cleanUser,
            score: numScore,
            best_score: bestScore,
            ip_address: ip || null,
            user_agent: userAgent || null,
            updated_at: new Date().toISOString(),
          })
          .eq("email", normalizedEmail);
      } else {
        await supabase.from("game_leaderboard").insert({
          username: cleanUser,
          email: normalizedEmail,
          score: numScore,
          best_score: numScore,
          ip_address: ip || null,
          user_agent: userAgent || null,
        });
      }

      // Rank calculation
      const { count: higherCount } = await supabase
        .from("game_leaderboard")
        .select("*", { count: "exact", head: true })
        .gt("best_score", bestScore);

      const { count: totalCount } = await supabase
        .from("game_leaderboard")
        .select("*", { count: "exact", head: true });

      const rank = (higherCount || 0) + 1;
      const totalPlayers = totalCount || 1;

      return {
        success: true,
        username: cleanUser,
        score: numScore,
        bestScore,
        rank,
        totalPlayers,
        isNewBest,
      };
    } catch (err) {
      console.error("Supabase leaderboard submit error, fallback to file:", err);
    }
  }

  // Local fallback
  const list = ensureLeaderboardFile();
  const existingIndex = list.findIndex((x) => x.email === normalizedEmail);

  let bestScore = numScore;
  let isNewBest = true;

  if (existingIndex >= 0) {
    const prev = list[existingIndex];
    bestScore = Math.max(prev.bestScore, numScore);
    isNewBest = numScore > prev.bestScore;
    list[existingIndex] = {
      ...prev,
      username: cleanUser,
      score: numScore,
      bestScore,
      ip,
      userAgent,
      ...(isNewBest ? { createdAt: new Date().toISOString() } : {}),
    };
  } else {
    list.push({
      id: `lb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUser,
      email: normalizedEmail,
      score: numScore,
      bestScore: numScore,
      createdAt: new Date().toISOString(),
      ip,
      userAgent,
    });
  }

  saveLeaderboardFile(list);

  // Sort by best score descending to compute rank
  const sorted = [...list].sort((a, b) => b.bestScore - a.bestScore);
  const rank = sorted.findIndex((x) => x.email === normalizedEmail) + 1;

  return {
    success: true,
    username: cleanUser,
    score: numScore,
    bestScore,
    rank: Math.max(1, rank),
    totalPlayers: list.length,
    isNewBest,
  };
}

export async function getPublicLeaderboard(limit = 25): Promise<PublicLeaderboardItem[]> {
  if (supabase) {
    try {
      const { data } = await supabase
        .from("game_leaderboard")
        .select("username, best_score, created_at")
        .order("best_score", { ascending: false })
        .limit(limit);

      if (data && data.length > 0) {
        return data.map((item, idx) => ({
          rank: idx + 1,
          username: item.username,
          score: item.best_score,
          createdAt: item.created_at,
        }));
      }
    } catch (err) {
      console.error("Supabase get leaderboard error:", err);
    }
  }

  const list = ensureLeaderboardFile();
  const sorted = [...list].sort((a, b) => b.bestScore - a.bestScore).slice(0, limit);

  return sorted.map((item, idx) => ({
    rank: idx + 1,
    username: item.username,
    score: item.bestScore,
    createdAt: item.createdAt,
  }));
}
