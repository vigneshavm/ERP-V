import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayData {
    day: number;
    expense: number;
    income: number;
    isCurrentMonth: boolean;
}

interface ExpenseCalendarProps {
    expenses: any[];
}

const ExpenseCalendar: React.FC<ExpenseCalendarProps> = ({ expenses }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const generateDays = () => {
        const days: DayData[] = [];
        const prevMonthDays = daysInMonth(currentYear, currentMonth - 1);
        const startDay = firstDayOfMonth(currentYear, currentMonth);

        // Padding for previous month
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, expense: 0, income: 0, isCurrentMonth: false });
        }

        // Current month days
        const count = daysInMonth(currentYear, currentMonth);
        for (let i = 1; i <= count; i++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayExpenses = expenses
                .filter(e => e.date.startsWith(dateStr))
                .reduce((sum, e) => sum + Number(e.amount), 0);

            days.push({ day: i, expense: dayExpenses, income: 0, isCurrentMonth: true });
        }

        return days;
    };

    const days = generateDays();
    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    return (
        <div className="bg-[var(--erp-bg)]/40 border border-default rounded-[2rem] p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight">{monthName} {currentYear}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewDate(new Date(currentYear, currentMonth - 1))}
                        className="p-2 hover:bg-[var(--erp-bg-sunken)] rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-neutral-400" />
                    </button>
                    <button
                        onClick={() => setViewDate(new Date(currentYear, currentMonth + 1))}
                        className="p-2 hover:bg-[var(--erp-bg-sunken)] rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-4">
                        {day}
                    </div>
                ))}

                {days.map((d, i) => (
                    <div
                        key={i}
                        className={`aspect-square p-2 border border-default rounded-xl flex flex-col items-center justify-between transition-all hover:bg-[var(--erp-bg-sunken)] cursor-pointer group ${!d.isCurrentMonth ? 'opacity-20' : ''}`}
                    >
                        <span className="text-xs font-bold text-neutral-400 group-hover:text-main">{d.day}</span>
                        {d.expense > 0 && (
                            <span className="text-[10px] font-black text-rose-500 tabular-nums">
                                {d.expense > 999 ? `${(d.expense / 1000).toFixed(1)}k` : d.expense}
                            </span>
                        )}
                        {d.income > 0 && (
                            <span className="text-[10px] font-black text-emerald-500 tabular-nums">
                                {d.income > 999 ? `${(d.income / 1000).toFixed(1)}k` : d.income}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseCalendar;
