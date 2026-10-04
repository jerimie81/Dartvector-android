import { Match, Player } from '../types/darts';

export interface League {
  id: string;
  name: string;
  format: 'round_robin' | 'knockout';
  players: Player[];
  status: 'active' | 'completed';
  createdAt: string;
  matches: string[]; // match IDs
  standings: Record<
    string,
    {
      played: number;
      won: number;
      lost: number;
      legsWon: number;
      legsLost: number;
      points: number;
      threeDartAvg: number;
    }
  >;
}

export const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', name: 'Phil The Power', avatar: '⚡', color: '#3B82F6', isBot: false, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'p2', name: 'Luke The Nuke', avatar: '🎯', color: '#F59E0B', isBot: false, createdAt: '2025-01-02T00:00:00.000Z' },
  { id: 'p3', name: 'Mighty Mike', avatar: '👑', color: '#10B981', isBot: false, createdAt: '2025-01-03T00:00:00.000Z' },
  { id: 'p4', name: 'The Iceman', avatar: '❄️', color: '#06B6D4', isBot: false, createdAt: '2025-01-04T00:00:00.000Z' },
  { id: 'p5', name: 'Snakebite Peter', avatar: '🐍', color: '#EC4899', isBot: false, createdAt: '2025-01-05T00:00:00.000Z' },
  { id: 'p6', name: 'Flying Scotsman', avatar: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#8B5CF6', isBot: false, createdAt: '2025-01-06T00:00:00.000Z' },
  { id: 'p7', name: 'Rob Cross Voltage', avatar: '🔌', color: '#F97316', isBot: false, createdAt: '2025-01-07T00:00:00.000Z' },
  { id: 'p8', name: 'Bully Boy Michael', avatar: '🐂', color: '#EF4444', isBot: false, createdAt: '2025-01-08T00:00:00.000Z' },
  { id: 'bot_lvl12', name: 'DartBot (Club)', avatar: '🤖', color: '#84CC16', isBot: true, botLevel: 12, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'bot_lvl18', name: 'DartBot (Pro)', avatar: '🔥', color: '#A855F7', isBot: true, botLevel: 18, createdAt: '2025-01-01T00:00:00.000Z' },
];

const STORE_MATCHES = 'matches';
const STORE_PLAYERS = 'players';
const STORE_LEAGUES = 'leagues';

export class AppStorage {
  private db: IDBDatabase | null = null;
  private isReady = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
    }
  }

  public async initDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve) => {
      const request = indexedDB.open('dartmaster_pro_db', 2);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_MATCHES)) {
          const store = db.createObjectStore(STORE_MATCHES, { keyPath: 'id' });
          store.createIndex('startTime', 'startTime', { unique: false });
          store.createIndex('gameType', 'gameType', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
          db.createObjectStore(STORE_PLAYERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_LEAGUES)) {
          db.createObjectStore(STORE_LEAGUES, { keyPath: 'id' });
        }
      };

      request.onsuccess = (e: any) => {
        this.db = e.target.result;
        this.isReady = true;
        this.ensureDefaultPlayers();
        resolve(this.db);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  private async ensureDefaultPlayers() {
    const players = await this.getPlayers();
    if (players.length === 0) {
      for (const p of DEFAULT_PLAYERS) {
        await this.savePlayer(p);
      }
    }
  }

  public async getPlayers(): Promise<Player[]> {
    try {
      const db = await this.initDB();
      if (!db) {
        const stored = localStorage.getItem('dartmaster_players');
        return stored ? JSON.parse(stored) : DEFAULT_PLAYERS;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PLAYERS, 'readonly');
        const req = tx.objectStore(STORE_PLAYERS).getAll();
        req.onsuccess = () => {
          resolve(req.result && req.result.length > 0 ? req.result : DEFAULT_PLAYERS);
        };
        req.onerror = () => resolve(DEFAULT_PLAYERS);
      });
    } catch {
      return DEFAULT_PLAYERS;
    }
  }

  public async savePlayer(player: Player): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const players = await this.getPlayers();
        const updated = [...players.filter((p) => p.id !== player.id), player];
        localStorage.setItem('dartmaster_players', JSON.stringify(updated));
        return;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PLAYERS, 'readwrite');
        const req = tx.objectStore(STORE_PLAYERS).put(player);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  }

  public async deletePlayer(playerId: string): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const players = (await this.getPlayers()).filter((p) => p.id !== playerId);
        localStorage.setItem('dartmaster_players', JSON.stringify(players));
        return;
      }
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_PLAYERS, 'readwrite');
        tx.objectStore(STORE_PLAYERS).delete(playerId);
        tx.oncomplete = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  public async saveMatch(match: Match): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const stored = localStorage.getItem('dartmaster_matches');
        const matches: Match[] = stored ? JSON.parse(stored) : [];
        const filtered = matches.filter((m) => m.id !== match.id);
        filtered.unshift(match);
        localStorage.setItem('dartmaster_matches', JSON.stringify(filtered.slice(0, 500)));
        return;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MATCHES, 'readwrite');
        const req = tx.objectStore(STORE_MATCHES).put(match);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  }

  public async getMatches(limit = 100): Promise<Match[]> {
    try {
      const db = await this.initDB();
      if (!db) {
        const stored = localStorage.getItem('dartmaster_matches');
        return stored ? JSON.parse(stored) : [];
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MATCHES, 'readonly');
        const index = tx.objectStore(STORE_MATCHES).index('startTime');
        const req = index.openCursor(null, 'prev');
        const list: Match[] = [];
        req.onsuccess = (e: any) => {
          const cursor = e.target.result;
          if (cursor && list.length < limit) {
            list.push(cursor.value);
            cursor.continue();
          } else {
            resolve(list);
          }
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async getMatchById(id: string): Promise<Match | null> {
    try {
      const db = await this.initDB();
      if (!db) {
        const matches = await this.getMatches(200);
        return matches.find((m) => m.id === id) || null;
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MATCHES, 'readonly');
        const req = tx.objectStore(STORE_MATCHES).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async deleteMatch(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const matches = (await this.getMatches(500)).filter((m) => m.id !== id);
        localStorage.setItem('dartmaster_matches', JSON.stringify(matches));
        return;
      }
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MATCHES, 'readwrite');
        tx.objectStore(STORE_MATCHES).delete(id);
        tx.oncomplete = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  public async getLeagues(): Promise<League[]> {
    try {
      const db = await this.initDB();
      if (!db) {
        const stored = localStorage.getItem('dartmaster_leagues');
        return stored ? JSON.parse(stored) : [];
      }

      return new Promise((resolve) => {
        const tx = db.transaction(STORE_LEAGUES, 'readonly');
        const req = tx.objectStore(STORE_LEAGUES).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async saveLeague(league: League): Promise<void> {
    try {
      const db = await this.initDB();
      if (!db) {
        const leagues = (await this.getLeagues()).filter((l) => l.id !== league.id);
        leagues.unshift(league);
        localStorage.setItem('dartmaster_leagues', JSON.stringify(leagues.slice(0, 100)));
        return;
      }

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LEAGUES, 'readwrite');
        const req = tx.objectStore(STORE_LEAGUES).put(league);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  }

  public async exportData(): Promise<string> {
    const players = await this.getPlayers();
    const matches = await this.getMatches(1000);
    const leagues = await this.getLeagues();
    return JSON.stringify(
      {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        players,
        matches,
        leagues,
      },
      null,
      2
    );
  }

  public async importData(jsonString: string): Promise<{ importedMatches: number; importedPlayers: number }> {
    const data = JSON.parse(jsonString);
    let matchCount = 0;
    let playerCount = 0;

    if (Array.isArray(data.players)) {
      for (const p of data.players) {
        await this.savePlayer(p);
        playerCount++;
      }
    }
    if (Array.isArray(data.matches)) {
      for (const m of data.matches) {
        await this.saveMatch(m);
        matchCount++;
      }
    }
    if (Array.isArray(data.leagues)) {
      for (const l of data.leagues) {
        await this.saveLeague(l);
      }
    }

    return { importedMatches: matchCount, importedPlayers: playerCount };
  }
}

export const appStorage = new AppStorage();
