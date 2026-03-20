import React, { useState, useEffect } from 'react';
import { 
    Modal, ModalContent, ModalHeader, ModalTitle, ModalTrigger 
} from "@repo/ui";
import { usePersonalFinance } from "@repo/shared";
import { Plus, Calculator, ChevronRight, Check } from "lucide-react";
import { evaluateExpression } from "../utils/math";

export const AddTransactionModal = ({ children }: { children: React.ReactNode }) => {
    const { categories, accounts, addTransaction, fetchCategories, fetchAccounts, addCategory } = usePersonalFinance();
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<"income" | "expense">("expense");
    const [amountExpr, setAmountExpr] = useState("");
    const [amount, setAmount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);
    
    // Smart Picker states
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryEmoji, setNewCategoryEmoji] = useState("💰");

    useEffect(() => {
        if (open) {
            fetchCategories();
            fetchAccounts();
        }
    }, [open, fetchCategories, fetchAccounts]);

    useEffect(() => {
        const val = evaluateExpression(amountExpr);
        setAmount(val);
    }, [amountExpr]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addTransaction({
                type,
                amount,
                category: selectedCategory,
                account: selectedAccount,
                date,
                description,
                isRecurring
            });
            setOpen(false);
            resetForm();
        } catch (err) {
            alert(err);
        }
    };

    const resetForm = () => {
        setAmountExpr("");
        setAmount(0);
        setSelectedCategory("");
        setSelectedAccount("");
        setDescription("");
        setIsRecurring(false);
    };

    const handleAddNewCategory = async () => {
        if (!newCategoryName) return;
        try {
            await addCategory({
                name: newCategoryName,
                emoji: newCategoryEmoji,
                type: type === "income" ? "income" : "expense"
            });
            setShowNewCategory(false);
            setNewCategoryName("");
        } catch (err) {
            alert(err);
        }
    };

    return (
        <Modal open={open} onOpenChange={setOpen}>
            <ModalTrigger asChild>{children}</ModalTrigger>
            <ModalContent className="sm:max-w-[425px]">
                <ModalHeader>
                    <ModalTitle>Add Transaction</ModalTitle>
                </ModalHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Type Toggle */}
                    <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === "expense" ? "bg-white dark:bg-neutral-700 shadow-sm text-red-600" : "text-neutral-500"}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("income")}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === "income" ? "bg-white dark:bg-neutral-700 shadow-sm text-green-600" : "text-neutral-500"}`}
                        >
                            Income
                        </button>
                    </div>

                    {/* Amount with Calculator */}
                    <div className="relative">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Amount</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={amountExpr}
                                onChange={(e) => setAmountExpr(e.target.value)}
                                placeholder="0.00"
                                className="w-full text-3xl font-bold bg-transparent border-none focus:ring-0 text-neutral-900 dark:text-neutral-100 pr-12"
                                autoFocus
                            />
                            <Calculator className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-300 group-focus-within:text-primary transition-colors" />
                        </div>
                        {amountExpr && amount !== Number(amountExpr) && (
                            <div className="text-sm text-neutral-400 mt-1">
                                = {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)}
                            </div>
                        )}
                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 mt-2" />
                    </div>

                    {/* Smart Category Picker */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</label>
                            <button 
                                type="button"
                                onClick={() => setShowNewCategory(!showNewCategory)}
                                className="text-xs text-primary font-medium flex items-center gap-1"
                            >
                                <Plus className="h-3 w-3" /> New
                            </button>
                        </div>
                        
                        {showNewCategory ? (
                            <div className="flex gap-2 animate-in slide-in-from-top-2">
                                <input 
                                    className="flex-1 bg-neutral-50 dark:bg-neutral-800 border-none rounded-md px-3 py-2 text-sm"
                                    placeholder="Category Name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddNewCategory}
                                    className="bg-primary text-white p-2 rounded-md"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {categories.filter(c => c.type === type || c.type === 'both').map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex flex-col items-center gap-2 p-3 min-w-[80px] rounded-xl border transition-all ${selectedCategory === cat.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"}`}
                                    >
                                        <span className="text-2xl">{(cat as any).emoji || "📦"}</span>
                                        <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Account Picker */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Account</label>
                        <select 
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc._id} value={acc._id}>
                                    {acc.bankName} - {acc.accountNumber.slice(-4)} (₹{acc.currentBalance})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date & Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Date</label>
                            <input 
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Recurring</label>
                            <button
                                type="button"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${isRecurring ? "border-primary bg-primary/5 text-primary" : "border-neutral-100 dark:border-neutral-800 text-neutral-500"}`}
                            >
                                {isRecurring ? "Enabled" : "Disabled"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!amount || !selectedCategory || !selectedAccount}
                        className="w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-4 rounded-2xl font-bold mt-4 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        Save {type === "income" ? "Income" : "Expense"}
                    </button>
                </form>
            </ModalContent>
        </Modal>
    );
};
