/**
 * Composite Data Source Adapter with Fallback
 * 
 * Implements automatic fallback from SQL to Mongo if SQL fails.
 * Abstracts the complexity of dual-source data access away from services/controllers.
 */

import { ICompositeDataSourceAdapter, IDataSourceAdapter, QueryOptions } from "./IDataSourceAdapter.js";
import { error } from "../../config/logger.js";

export class CompositeDataSourceAdapter<T = any> implements ICompositeDataSourceAdapter<T> {
    private primaryAdapter: IDataSourceAdapter<T> | null = null;
    private fallbackAdapter: IDataSourceAdapter<T> | null = null;
    private lastUsedSource: 'mongo' | 'sql' | null = null;

    withFallback(primary: IDataSourceAdapter<T>, fallback: IDataSourceAdapter<T>): this {
        this.primaryAdapter = primary;
        this.fallbackAdapter = fallback;
        return this;
    }

    async execute(tenantId: string, query: QueryOptions): Promise<T> {
        if (!this.primaryAdapter || !this.fallbackAdapter) {
            throw new Error('CompositeDataSourceAdapter: Primary and fallback adapters must be configured');
        }

        try {
            const result = await this.primaryAdapter.execute(tenantId, query);
            this.lastUsedSource = this.primaryAdapter.getSource();
            return result;
        } catch (err) {
            error(
                `Data source error from ${this.primaryAdapter.getName()}: ${(err as Error).message}. Falling back to ${this.fallbackAdapter.getName()}`,
                { stack: (err as Error).stack }
            );

            try {
                const result = await this.fallbackAdapter.execute(tenantId, query);
                this.lastUsedSource = this.fallbackAdapter.getSource();
                return result;
            } catch (fallbackErr) {
                error(
                    `Both ${this.primaryAdapter.getName()} and ${this.fallbackAdapter.getName()} failed: ${(fallbackErr as Error).message}`,
                    { stack: (fallbackErr as Error).stack }
                );
                throw fallbackErr;
            }
        }
    }

    getSource(): 'mongo' | 'sql' {
        return this.primaryAdapter?.getSource() ?? 'mongo';
    }

    getName(): string {
        return `Composite[${this.primaryAdapter?.getName() ?? 'unknown'} → ${this.fallbackAdapter?.getName() ?? 'unknown'}]`;
    }

    getLastUsedSource(): 'mongo' | 'sql' | null {
        return this.lastUsedSource;
    }
}
