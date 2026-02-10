// Solana Token Market Cap PnL Analyzer Logic
const MemeProfitCalculator = {
    // Quote array for shareable cards
    quotes: [
        "Grandma… is it today?",
        "Mama are we leaving the hood today?",
        "One more leg.",
        "Trust the thesis.",
        "If this hits I'm retired.",
        "Dev don't rug.",
        "God willing.",
        "Is this what they call financial freedom?",
        "Diamond hands activated."
    ],

    // Store calculated values for card generation
    calculatedData: null,

    // Initialize calculator
    init() {
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        const calculateBtn = document.getElementById('calculateBtn');
        calculateBtn.addEventListener('click', () => this.calculate());

        const generateCardBtn = document.getElementById('generateCardBtn');
        generateCardBtn.addEventListener('click', () => this.generateCard());

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
        const entryAmount = parseFloat(document.getElementById('entryAmount').value);
        const entryMarketCap = parseFloat(document.getElementById('entryMarketCap').value);
        const targetMarketCap = parseFloat(document.getElementById('targetMarketCap').value);
        
        // Optional fields - default to 0 if empty
        const buySlippageVal = document.getElementById('buySlippage').value;
        const sellSlippageVal = document.getElementById('sellSlippage').value;
        const priorityFeesVal = document.getElementById('priorityFees').value;
        
        const buySlippage = buySlippageVal === '' ? 0 : parseFloat(buySlippageVal);
        const sellSlippage = sellSlippageVal === '' ? 0 : parseFloat(sellSlippageVal);
        const priorityFees = priorityFeesVal === '' ? 0 : parseFloat(priorityFeesVal);
        const includeBotFee = document.getElementById('botFee').checked;

        return {
            entryAmount,
            entryMarketCap,
            targetMarketCap,
            buySlippage,
            sellSlippage,
            priorityFees,
            includeBotFee
        };
    },

    // Validate inputs
    validate(values) {
        const { entryAmount, entryMarketCap, targetMarketCap } = values;

        if (isNaN(entryAmount) || entryAmount <= 0) {
            return 'Please enter a valid entry amount greater than 0';
        }

        if (isNaN(entryMarketCap) || entryMarketCap <= 0) {
            return 'Please enter a valid entry market cap greater than 0';
        }

        if (isNaN(targetMarketCap) || targetMarketCap <= 0) {
            return 'Please enter a valid target market cap greater than 0';
        }

        return null;
    },

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        document.getElementById('resultsSection').classList.remove('visible');
        document.getElementById('generateCardBtn').classList.remove('visible');
    },

    // Hide error message
    hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.classList.remove('visible');
    },

    // Format number to specified decimal places
    formatDecimal(value, decimals = 4) {
        return parseFloat(value.toFixed(decimals));
    },

    // Format large numbers with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

        const { entryAmount, entryMarketCap, targetMarketCap, buySlippage, sellSlippage, priorityFees, includeBotFee } = values;

        // Step 1: Calculate multiplier
        const multiplier = targetMarketCap / entryMarketCap;

        // Step 2: Apply buy slippage to entry
        const afterBuySlippage = entryAmount * (1 - buySlippage / 100);

        // Step 3: Calculate gross exit SOL (before sell slippage)
        const grossExitSOL = afterBuySlippage * multiplier;

        // Step 4: Apply sell slippage
        const afterSellSlippage = grossExitSOL * (1 - sellSlippage / 100);

        // Step 5: Deduct bot fee if checked (1% of exit value)
        let afterBotFee = afterSellSlippage;
        if (includeBotFee) {
            afterBotFee = afterSellSlippage * 0.99;
        }

        // Step 6: Deduct priority fees
        const netSOL = afterBotFee - priorityFees;

        // Step 7: Calculate profit
        const profitSOL = netSOL - entryAmount;

        // Step 8: Calculate ROI
        const roiPercent = (profitSOL / entryAmount) * 100;

        // Store calculated data for card generation
        this.calculatedData = {
            entryAmount,
            entryMarketCap,
            targetMarketCap,
            profitSOL,
            netSOL,
            roiPercent,
            multiplier
        };

        // Display results
        this.displayResults(profitSOL, netSOL, roiPercent, multiplier);
    },

    // Display results
    displayResults(profitSOL, netSOL, roiPercent, multiplier) {
        // Format and display Projected Profit (SOL)
        const profitElement = document.getElementById('profitSOL');
        profitElement.textContent = `${this.formatDecimal(profitSOL, 4)} SOL`;
        profitElement.className = 'result-value';
        if (profitSOL > 0) {
            profitElement.classList.add('positive');
        } else if (profitSOL < 0) {
            profitElement.classList.add('negative');
        }

        // Format and display Projected Net SOL
        const netElement = document.getElementById('netSOL');
        netElement.textContent = `${this.formatDecimal(netSOL, 4)} SOL`;
        netElement.className = 'result-value highlight';

        // Format and display ROI
        const roiElement = document.getElementById('roi');
        roiElement.textContent = `${this.formatDecimal(roiPercent, 2)}%`;
        roiElement.className = 'result-value';
        if (roiPercent > 0) {
            roiElement.classList.add('positive');
        } else if (roiPercent < 0) {
            roiElement.classList.add('negative');
        }

        // Format and display Multiplier
        document.getElementById('multiplier').textContent = `${this.formatDecimal(multiplier, 2)}x`;

        // Show results section
        document.getElementById('resultsSection').classList.add('visible');

        // Show generate card button
        document.getElementById('generateCardBtn').classList.add('visible');
    },

    // Generate shareable PnL card
    generateCard() {
        if (!this.calculatedData) {
            this.showError('Please calculate PnL first');
            return;
        }

        const { entryAmount, entryMarketCap, targetMarketCap, profitSOL, roiPercent } = this.calculatedData;

        // Populate card with data
        document.getElementById('cardEntryMC').textContent = `$${this.formatNumber(Math.round(entryMarketCap))}`;
        document.getElementById('cardTargetMC').textContent = `$${this.formatNumber(Math.round(targetMarketCap))}`;
        document.getElementById('cardEntrySOL').textContent = `${this.formatDecimal(entryAmount, 4)} SOL`;
        document.getElementById('cardProfitSOL').textContent = `${this.formatDecimal(profitSOL, 4)} SOL`;
        document.getElementById('cardROI').textContent = `${this.formatDecimal(roiPercent, 2)}%`;

        // Select random quote
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        document.getElementById('cardQuote').textContent = `"${randomQuote}"`;

        // Show card for rendering
        const card = document.getElementById('pnlCard');
        card.classList.add('rendering');

        // Use html2canvas to capture and download
        html2canvas(card, {
            width: 1200,
            height: 675,
            scale: 2,
            backgroundColor: '#0b0f19'
        }).then(canvas => {
            // Convert canvas to blob and download
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'quantcalc-pnl.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);

                // Hide card after rendering
                card.classList.remove('rendering');
            });
        });
    }
};

// Initialize calculator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MemeProfitCalculator.init());
} else {
    MemeProfitCalculator.init();
}
