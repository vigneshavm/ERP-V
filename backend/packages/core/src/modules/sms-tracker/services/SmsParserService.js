import { info } from '@smarterp/shared/config/logger.js';
export class SmsParserService {
    /**
     * Parses a raw SMS string into structured data.
     * Supports common Indian bank SMS formats.
     */
    static parse(text, sender) {
        const result = {
            amount: 0,
            date: new Date(),
            type: 'unknown',
            bankName: this.identifyBank(sender, text)
        };
        // Normalize text
        const cleanText = text.toLowerCase();
        // 1. Identify Type (Debit/Credit)
        if (cleanText.includes('debited') || cleanText.includes('spent') || cleanText.includes('withdrawn') || cleanText.includes('sent') || cleanText.includes('paid')) {
            result.type = 'debit';
        }
        else if (cleanText.includes('credited') || cleanText.includes('received') || cleanText.includes('deposited')) {
            result.type = 'credit';
        }
        // 2. Extract Amount
        const amountRegex = /(?:rs\.?|inr|amt|vpa)\s*([\d,]+(?:\.\d{2})?)/i;
        const amountMatch = text.match(amountRegex);
        if (amountMatch) {
            result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }
        // 3. Extract Account Number (Last 4 digits)
        const accountRegex = /(?:a\/c|acct|acc|account|card|xx)\s*(?:no\.?\s*)?(\d{3,4}|[x*]+\d{3,4})/i;
        const accountMatch = text.match(accountRegex);
        if (accountMatch) {
            const match = accountMatch[1];
            result.accountNumber = match.slice(-4);
        }
        // 4. Extract Merchant/Recipient (Roughly)
        const merchantRegex = /(?:at|to|info|towards)\s+([^.\n]+)/i;
        const merchantMatch = text.match(merchantRegex);
        if (merchantMatch) {
            result.merchant = merchantMatch[1].trim();
        }
        // 5. Date (If present in text, otherwise use current)
        const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
        const dateMatch = text.match(dateRegex);
        if (dateMatch) {
            const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?)/i;
            const timeMatch = text.match(timeRegex);
            const dateStr = dateMatch[1];
            const timeStr = timeMatch ? ` ${timeMatch[1]}` : '';
            try {
                const parts = dateStr.split(/[-/]/);
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    let year = parseInt(parts[2]);
                    if (year < 100)
                        year += 2000;
                    let hour = 0, minute = 0;
                    if (timeStr) {
                        const tMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
                        if (tMatch) {
                            hour = parseInt(tMatch[1]);
                            minute = parseInt(tMatch[2]);
                            if (tMatch[4]?.toLowerCase() === 'pm' && hour < 12)
                                hour += 12;
                            if (tMatch[4]?.toLowerCase() === 'am' && hour === 12)
                                hour = 0;
                        }
                    }
                    const dateObj = new Date(year, month, day, hour, minute);
                    if (!isNaN(dateObj.getTime())) {
                        result.date = dateObj;
                    }
                }
            }
            catch (e) {
                // Fallback
            }
        }
        // 6. Auto-Categorize (if Debit)
        if (result.type === 'debit') {
            result.suggestedCategory = this.categorize(result.merchant || '', cleanText);
        }
        info(`Parsed SMS: ${JSON.stringify(result)}`);
        return result;
    }
    static categorize(merchant, text) {
        const m = merchant.toUpperCase();
        const t = text.toUpperCase();
        // Food & Refreshments
        if (m.includes('ZOMATO') || m.includes('SWIGGY') || m.includes('ZEPTO') || m.includes('BLINKIT') ||
            m.includes('DUNZO') || m.includes('BBDAILY') || m.includes('BIGBASKET') ||
            t.includes('RESTAURANT') || t.includes('HOTEL') || t.includes('CAFE') || t.includes('BAKERY')) {
            return 'Food & Refreshments';
        }
        // Transportation
        if (m.includes('UBER') || m.includes('OLA') || m.includes('RAPIDO') || m.includes('INDIVER') ||
            t.includes('FUEL') || t.includes('PETROL') || t.includes('DIESEL') || t.includes('SHELL') || t.includes('BPCL') || t.includes('HPCL')) {
            return 'Transportation';
        }
        // Utilities
        if (t.includes('EBILL') || t.includes('ELECTRICITY') || t.includes('WATER BILL') ||
            t.includes('RECHARGE') || m.includes('JIO') || m.includes('AIRTEL') || m.includes('VI ') || m.includes('BSNL') ||
            t.includes('BROADBAND') || t.includes('GAS BILL') || t.includes('POSTPAID')) {
            return 'Utilities';
        }
        // Travel
        if (m.includes('IRCTC') || m.includes('MAKEMYTRIP') || m.includes('GOIBIBO') || m.includes('INDIGO') ||
            m.includes('AIR INDIA') || t.includes('AIRLINES') || t.includes('BUS TICKET')) {
            return 'Travel';
        }
        // Office Supplies / E-commerce
        if (m.includes('AMAZON') || m.includes('FLIPKART') || m.includes('MEESHO') || m.includes('NYKAA')) {
            return 'Office Supplies';
        }
        // Rent/Lease
        if (t.includes('RENT') || t.includes('LEASE')) {
            return 'Rent';
        }
        // Salaries
        if (t.includes('SALARY') || t.includes('STI') || t.includes('BONUS')) {
            return 'Salaries';
        }
        return 'Miscellaneous';
    }
    static identifyBank(sender, text) {
        const s = sender.toUpperCase();
        if (s.includes('HDFC'))
            return 'HDFC';
        if (s.includes('SBI'))
            return 'SBI';
        if (s.includes('ICICI'))
            return 'ICICI';
        if (s.includes('AXIS'))
            return 'AXIS';
        if (s.includes('KOTAK'))
            return 'KOTAK';
        if (s.includes('PNB'))
            return 'PNB';
        if (s.includes('BOB'))
            return 'BOB';
        // Check text if sender is generic
        const t = text.toUpperCase();
        if (t.includes('HDFC BANK'))
            return 'HDFC';
        if (t.includes('STATE BANK OF INDIA'))
            return 'SBI';
        return 'Unknown';
    }
}
