import { supabase } from '../lib/supabase';

export const fetchTransactionsRaw = async (tenantId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('transactions').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
};

export const fetchChequesRaw = async (tenantId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('cheques').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
};

export const fetchDailyFinanceRaw = async (tenantId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('daily_finance').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
};
