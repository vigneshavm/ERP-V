
/** Portable deployment: never create users, grant rights, or heal database permissions. */
export interface DbAccessResult { database: string; applied: string[]; skipped: string[]; }
export const WRITE_TABLES: readonly string[] = [];
export function adminConfigured(_env?: NodeJS.ProcessEnv): boolean { void _env; return false; }
export async function ensureErpDbAccess(_targetDb?: string): Promise<DbAccessResult> {
  void _targetDb;
  throw new Error('SQL permission repair is disabled in this deployment.');
}
export function isDbAccessError(err: unknown): boolean {
  return /Cannot open database|permission was denied|is not able to access the database/i.test(String((err as Error)?.message || err));
}
export async function healDbAccess(_err: unknown): Promise<boolean> { void _err; return false; }
