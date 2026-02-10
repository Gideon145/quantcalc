// Solana Meme Coin Profit Calculator Logic
const MemeProfitCalculator = {
    // Solana price in USD (you can make this dynamic later)
    solanaPrice: 100, // Default assumption

    // Initialize calculator
    init() {
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        const calculateBtn = document.getElementById('calculateBtn');
        calculateBtn.addEventListener('click', () => this.calculate());

        // Add Enter key support
        const inputs = document.querySelectorAll('.input-field');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calculate();
                }
            });
        });
    },

    // Get input values
    getInputValues() {
        return {
            entryAmount: parseFloat(document.getElementById('entryAmount').value),
            entryPrice: parseFloat(document.getElementById('entryPrice').value),
            exitPrice: parseFloat(document.getElementById('exitPrice').value),
            buySlippage: parseFloat(document.getElementById('buySlippage').value),
            sellSlippage: parseFloat(document.getElementById('sellSlippage').value),
            priorityFees: parseFloat(document.getElementById('priorityFees').value),
            includeBotFee: document.getElementById('botFee').checked
        };
    },

    // Validate inputs
    validate(values) {
        const { entryAmount, entryPrice, exitPrice, buySlippage, sellSlippage, priorityFees } = values;

        if (isNaN(entryAmount) || entryAmount <= 0) {
            return 'Please enter a valid entry amount greater than 0';
        }

        if (isNaN(entryPrice) || entryPrice <= 0) {
            return 'Please enter a valid entry price greater than 0';
        }

        if (isNaN(exitPrice) || exitPrice <= 0) {
            return 'Please enter a valid exit price greater than 0';
        }

        if (isNaN(buySlippage) || buySlippage < 0 || buySlippage > 100) {
            return 'Please enter a buy slippage between 0 and 100';
        }

        if (isNaN(sellSlippage) || sellSlippage < 0 || sellSlippage > 100) {
            return 'Please enter a sell slippage between 0 and 100';
        }

        if (isNaN(priorityFees) || priorityFees < 0) {
            return 'Please enter valid priority fees (0 or greater)';
        }

        return null;
    },

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        document.getElementById('resultsSection').classList.remove('visible');
    },

    // Hide error message
    hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.classList.remove('visible');
    },

    // Format number to 4 decimal places
    formatDecimal(value, decimals = 4) {
        return parseFloat(value.toFixed(decimals));
    },

    // Calculate profit
    calculate() {
        const values = this.getInputValues();
        
        // Validate inputs
        const error = this.validate(values);
        if (error) {
            this.showError(error);
            return;
        }

        this.hideError();

        const { entryAmount, entryPrice, exitPrice, buySlippage, sellSlippage, priorityFees, includeBotFee } = values;

        // Step 1: Convert Entry SOL into USD value
        const entryValueUSD = entryAmount * this.solanaPrice;

        // Step 2: Apply buy slippage to entry value
        const buySlippageMultiplier = 1 - (buySlippage / 100);
        const effectiveEntryValueUSD = entryValueUSD * buySlippageMultiplier;

        // Step 3: Calculate tokens bought
        const tokensBought = effectiveEntryValueUSD / entryPrice;

        // Step 4: Calculate exit value before sell slippage
        const exitValueBeforeSlippage = tokensBought * exitPrice;

        // Step 5: Apply sell slippage
        const sellSlippageMultiplier = 1 - (sellSlippage / 100);
        const exitValueAfterSlippage = exitValueBeforeSlippage * sellSlippageMultiplier;

        // Step 6: Deduct bot fee if selected (1% of exit value)
        let exitValueAfterBotFee = exitValueAfterSlippage;
        if (includeBotFee) {
            exitValueAfterBotFee = exitValueAfterSlippage * 0.99;
        }

        // Step 7: Convert exit value back to SOL
        const exitValueSOL = exitValueAfterBotFee / this.solanaPrice;

        // Step 8: Deduct priority fees
        const finalSOL = exitValueSOL - priorityFees;

        // Step 9: Calculate net profit
        const netProfitSOL = finalSOL - entryAmount;
        const netProfitUSD = netProfitSOL * this.solanaPrice;

        // Step 10: Calculate ROI percentage
        const roi = (netProfitSOL / entryAmount) * 100;

        // Step 11: Calculate break-even percentage
        // To break even, we need to find the exit price where net profit = 0
        // Working backwards:
        // finalSOL = entryAmount
        // exitValueSOL = entryAmount + priorityFees
        // exitValueAfterBotFee = (entryAmount + priorityFees) * solanaPrice
        // exitValueAfterSlippage = exitValueAfterBotFee / (includeBotFee ? 0.99 : 1)
        // exitValueBeforeSlippage = exitValueAfterSlippage / sellSlippageMultiplier
        // breakEvenExitPrice = exitValueBeforeSlippage / tokensBought
        
        const breakEvenSOL = entryAmount + priorityFees;
        const breakEvenUSD = breakEvenSOL * this.solanaPrice;
        const breakEvenAfterBotFee = breakEvenUSD / (includeBotFee ? 0.99 : 1);
        const breakEvenBeforeSlippage = breakEvenAfterBotFee / sellSlippageMultiplier;
        const breakEvenExitPrice = breakEvenBeforeSlippage / tokensBought;
        const breakEvenMove = ((breakEvenExitPrice - entryPrice) / entryPrice) * 100;

        // Display results
        this.displayResults(netProfitSOL, netProfitUSD, roi, breakEvenMove);
    },

    // Display results
    displayResults(netProfitSOL, netProfitUSD, roi, breakEvenMove) {
        // Format and display Net Profit (SOL)
        const solElement = document.getElementById('netProfitSOL');
        solElement.textContent = `${this.formatDecimal(netProfitSOL, 4)} SOL`;
        solElement.className = 'result-value';
        if (netProfitSOL > 0) {
            solElement.classList.add('positive');
        } else if (netProfitSOL < 0) {
            solElement.classList.add('negative');
        }

        // Format and display Net Profit (USD)
        const usdElement = document.getElementById('netProfitUSD');
        usdElement.textContent = `$${this.formatDecimal(netProfitUSD, 2)}`;
        usdElement.className = 'result-value highlight';

        // Format and display ROI
        const roiElement = document.getElementById('roi');
        roiElement.textContent = `${this.formatDecimal(roi, 2)}%`;
        roiElement.className = 'result-value';
        if (roi > 0) {
            roiElement.classList.add('positive');
        } else if (roi < 0) {
            roiElement.classList.add('negative');
        }

        // Format and display Break-Even Move
        document.getElementById('breakEven').textContent = `${this.formatDecimal(breakEvenMove, 2)}%`;

        // Show results section
        document.getElementById('resultsSection').classList.add('visible');
    }
};

// Initialize calculator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MemeProfitCalculator.init());
} else {
    MemeProfitCalculator.init();
}
