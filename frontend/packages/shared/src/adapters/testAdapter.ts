import { dataAdapter } from './index';

async function testAdapter() {
    console.log('--- Testing Mock Data Adapter ---');
    
    console.log('1. Fetching User...');
    const user = await dataAdapter.getUser();
    console.log(`User: ${user.name} (${user.email})`);

    console.log('2. Fetching Transactions (Limit 3)...');
    const txns = await dataAdapter.getTransactions(3);
    console.log(`Found ${txns.length} transactions:`);
    txns.forEach(t => console.log(` - ${t.date.split('T')[0]} | ${t.amount} INR | ${t.category} | ${t.description}`));

    console.log('3. Fetching Goals...');
    const goals = await dataAdapter.getGoals();
    console.log(`Found ${goals.length} goals:`);
    goals.forEach(g => console.log(` - ${g.name}: ${g.currentAmount}/${g.targetAmount} (${g.status})`));

    console.log('4. Fetching Analytics...');
    const analytics = await dataAdapter.getAnalyticsSummary('month');
    console.log(`Monthly Income: ${analytics.totalIncome} | Expense: ${analytics.totalExpense}`);

    console.log('--- Test Complete ---');
}

testAdapter().catch(console.error);
