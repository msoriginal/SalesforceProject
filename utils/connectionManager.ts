import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export type UserCredentials = {
  username: string;
  password?: string;
  refresh_token?: string;
  client_id?: string;
  client_secret?: string;
  // any other per-user fields you need
  [key: string]: any;
};

export type CredentialsFile = {
  users: Record<string, UserCredentials>;
};


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_DIR = path.resolve(__dirname, '..');
const DEFAULT_PATH = path.resolve(BASE_DIR, 'credentials.json');

export class ConnectionManager {
  private filePath: string;
  private data: CredentialsFile;
  private env?: string;

  /**
   * Create a ConnectionManager.
   * @param filePath optional explicit path to credentials file. If omitted, will try env-specific file (credentials.<env>.json) or credentials.json.
   * @param env optional environment name (qa, uat, prod). Falls back to process.env.ENV or process.env.NODE_ENV.
   */
  constructor(filePath?: string, env?: string) {
    this.env = env || process.env.ENV || process.env.NODE_ENV;
    // Resolve file path: explicit filePath wins; otherwise prefer credentials.<env>.json when env provided and file exists
    if (filePath) {
      this.filePath = path.resolve(filePath);
    } else if (this.env) {
      const envPath = path.resolve(BASE_DIR, `credentials.${this.env}.json`);
      if (fs.existsSync(envPath)) {
        this.filePath = envPath;
      } else {
        this.filePath = DEFAULT_PATH;
      }
    } else {
      this.filePath = DEFAULT_PATH;
    }

    this.data = { users: {} };
    this.load();
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      this.data = { users: {} };
      return;
    }
    const raw = fs.readFileSync(this.filePath, 'utf8');
    try {
      const parsed = JSON.parse(raw) as any;

      // If file is a plain credentials file with { users: {...} }
      if (parsed && parsed.users && typeof parsed.users === 'object') {
        this.data = { users: parsed.users } as CredentialsFile;
        return;
      }

      // If file is an environment-grouped file like { qa: { users: {...} }, uat: { users: {...} } }
      if (this.env && parsed && parsed[this.env]) {
        const section = parsed[this.env];
        if (section.users && typeof section.users === 'object') {
          this.data = { users: section.users };
          return;
        }
        // If the section itself is the users object (no nested 'users' key)
        if (typeof section === 'object') {
          this.data = { users: section } as CredentialsFile;
          return;
        }
      }

      // As a last resort, if parsed is a map of users directly, treat it as users
      if (parsed && typeof parsed === 'object') {
        // detect if all values look like credential entries (have username or password fields)
        const maybeUsers: Record<string, any> = parsed;
        const keys = Object.keys(maybeUsers);
        if (keys.length > 0) {
          const sample = maybeUsers[keys[0]];
          if (sample && (sample.username || sample.password || sample.client_id)) {
            this.data = { users: maybeUsers } as CredentialsFile;
            return;
          }
        }
      }

      // Nothing matched — keep empty store
      this.data = { users: {} };
    } catch (err) {
      throw new Error(`Failed to parse credentials file at ${this.filePath}: ${(err as Error).message}`);
    }
  }

  private save(): void {
    const content = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(this.filePath, content, { encoding: 'utf8' });
  }

  listUsers(): string[] {
    return Object.keys(this.data.users);
  }

  getUser(key: string): UserCredentials | undefined {
    return this.data.users[key];
  }

  addUser(key: string, creds: UserCredentials, overwrite = false): void {
    if (!overwrite && this.data.users[key]) {
      throw new Error(`User ${key} already exists. Use overwrite=true to replace.`);
    }
    this.data.users[key] = creds;
    this.save();
  }

  removeUser(key: string): void {
    if (!this.data.users[key]) return;
    delete this.data.users[key];
    this.save();
  }

  // Convenience: return a credentials object for use in login flows
  getForLogin(key: string): UserCredentials {
    const u = this.getUser(key);
    if (!u) throw new Error(`User ${key} not found in credentials store`);
    return u;
  }

  /**
   * Find a user key by matching username/email value stored in credentials.
   * Returns the key (e.g. 'userA') or undefined if not found.
   */
  findUserKeyByUsername(username: string): string | undefined {
    const keys = this.listUsers();
    for (const k of keys) {
      const c = this.getUser(k);
      if (!c) continue;
      if (c.username && c.username.toLowerCase() === username.toLowerCase()) return k;
      if (c.email && c.email.toLowerCase() === username.toLowerCase()) return k;
    }
    return undefined;
  }

  getUserByUsername(username: string): UserCredentials | undefined {
    const key = this.findUserKeyByUsername(username);
    return key ? this.getForLogin(key) : undefined;
  }

  /**
   * Set active environment (qa/uat/prod) and reload credentials.
   */
  setEnvironment(env: string): void {
    this.env = env;
    // Prefer a credentials.<env>.json file if it exists
    const envPath = path.resolve(BASE_DIR, `credentials.${env}.json`);
    if (fs.existsSync(envPath)) {
      this.filePath = envPath;
    } else {
      // fallback to default and rely on the file having an env section
      this.filePath = DEFAULT_PATH;
    }
    this.load();
  }

  getEnvironment(): string | undefined {
    return this.env;
  }
}

export default ConnectionManager;
