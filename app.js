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

// Smooth page transitions
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth transitions to all navigation links
    const links = document.querySelectorAll('a:not([target="_blank"])');
    
    links.forEach(link => {
        // Skip disabled links and anchor links
        if (link.classList.contains('tool-btn-disabled') || link.getAttribute('href')?.startsWith('#')) {
            return;
        }
        
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Only apply to internal navigation (not external links)
            if (href && !href.startsWith('http') && !href.startsWith('//')) {
                e.preventDefault();
                
                // Fade out current page
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';
                
                // Navigate after fade out
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
});
