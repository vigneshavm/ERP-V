import { listSqlMaster } from "./sqlMasters.js";

export interface ExpenseCategoryEntry {
  _id: string;
  id: string;
  name: string;
  monthly_budget: number;
  approval_required: boolean;
  is_cash_allowed: boolean;
  is_active: boolean;
  gst_eligible: boolean;
  groupId?: string;
}

export async function listExpenseCategories(): Promise<ExpenseCategoryEntry[]> {
  const [groups, names] = await Promise.all([
    listSqlMaster("EXPENSE_GROUP"),
    listSqlMaster("EXPENSE_NAME"),
  ]);
  return names.map((category) => ({
    _id: category.id,
    id: category.id,
    name: category.name,
    monthly_budget: 0,
    approval_required: false,
    is_cash_allowed: true,
    is_active: true,
    gst_eligible: false,
    groupId: category.parentId && groups.some((group) => group.id === category.parentId) ? category.parentId : undefined,
  }));
}


