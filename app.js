// ==========================================
// QuantCalc - Professional Trading Calculators
// ==========================================

console.log('QuantCalc Loaded');

// Application State
const QuantCalc = {
    version: '1.0.0',
    
    // Position Size Calculator
    calculatePositionSize(accountBalance, riskPercentage, entryPrice, stopLoss) {
        const riskAmount = accountBalance * (riskPercentage / 100);
        const positionSize = riskAmount / Math.abs(entryPrice - stopLoss);
        return { riskAmount, positionSize, unitsToBuy: Math.floor(positionSize) };
    },
    
    // Crypto Profit Calculator
    calculateCryptoProfit(entryPrice, exitPrice, positionSize) {
        const profit = (exitPrice - entryPrice) * positionSize;
        const profitPercentage = ((exitPrice - entryPrice) / entryPrice) * 100;
        return { profit, profitPercentage };
    }
};
