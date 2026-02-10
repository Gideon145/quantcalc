// Solana Token Market Cap PnL Analyzer Logic
const MemeProfitCalculator = {
    // Quote array for shareable cards
    quotes: [
        "Grandma… is it today?",
        "Mama… are we leaving the hood today?",
        "Tell Binance we're coming.",
        "Screenshots before the sell.",
        "Risk first. Lambo later."
    ],

    // Store calculated values for card generation
    calculatedData: null,
    
    // Live SOL price from CoinGecko
    solUsdPrice: 0,

    // Initialize calculator
    init() {
        this.setupEventListeners();
        this.fetchSolPrice(); // Fetch SOL price on load
    },
    
    // Fetch live SOL price from CoinGecko
    async fetchSolPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await response.json();
            this.solUsdPrice = data.solana.usd;
        } catch (error) {
            console.error('Failed to fetch SOL price:', error);
            this.solUsdPrice = 0;
        }
    },
    
    // Parse market cap input with k, m, b support
    parseMarketCap(value) {
        if (!value) return 0;
        
        // Convert to string and trim
        const clean = String(value).toLowerCase().trim();
        
        // Remove commas
        const noCommas = clean.replace(/,/g, '');
        
        // Parse the number
        const number = parseFloat(noCommas);
        
        if (isNaN(number)) return 0;
        
        // Check for suffix
        if (noCommas.endsWith('k')) {
            return number * 1000;
        }
        if (noCommas.endsWith('m')) {
            return number * 1000000;
        }
        if (noCommas.endsWith('b')) {
            return number * 1000000000;
        }
        
        // No suffix - return raw number
        return number;
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
        const entryMarketCapRaw = document.getElementById('entryMarketCap').value;
        const targetMarketCapRaw = document.getElementById('targetMarketCap').value;
        
        // Parse market cap values with k, m, b support
        const entryMarketCap = this.parseMarketCap(entryMarketCapRaw);
        const targetMarketCap = this.parseMarketCap(targetMarketCapRaw);
        
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
    async calculate() {
        const values = this.getInputValues();
        
        // Validate inputs
        const error = this.validate(values);
        if (error) {
            this.showError(error);
            return;
        }

        this.hideError();

        // Fetch latest SOL price
        await this.fetchSolPrice();

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
        
        // Step 8: Calculate USD values
        const profitUSD = profitSOL * this.solUsdPrice;
        const netUSD = netSOL * this.solUsdPrice;

        // Step 9: Calculate ROI
        const roiPercent = (profitSOL / entryAmount) * 100;

        // Store calculated data for card generation
        this.calculatedData = {
            entryAmount,
            entryMarketCap,
            targetMarketCap,
            profitSOL,
            profitUSD,
            netSOL,
            netUSD,
            roiPercent,
            multiplier
        };

        // Display results
        this.displayResults(profitSOL, profitUSD, netUSD, roiPercent, multiplier);
    },

    // Display results
    displayResults(profitSOL, profitUSD, netUSD, roiPercent, multiplier) {
        // Format and display Projected Profit (SOL)
        const profitSOLElement = document.getElementById('profitSOL');
        profitSOLElement.textContent = `${this.formatDecimal(profitSOL, 4)} SOL`;
        profitSOLElement.className = 'result-value';
        if (profitSOL > 0) {
            profitSOLElement.classList.add('positive');
        } else if (profitSOL < 0) {
            profitSOLElement.classList.add('negative');
        }

        // Format and display Projected Profit (USD)
        const profitUSDElement = document.getElementById('profitUSD');
        profitUSDElement.textContent = `$${this.formatNumber(Math.round(profitUSD))}`;
        profitUSDElement.className = 'result-value highlight';
        if (profitUSD > 0) {
            profitUSDElement.classList.add('positive');
        } else if (profitUSD < 0) {
            profitUSDElement.classList.add('negative');
        }
        
        // Format and display Projected Net Value (USD)
        const netUSDElement = document.getElementById('netUSD');
        netUSDElement.textContent = `$${this.formatNumber(Math.round(netUSD))}`;
        netUSDElement.className = 'result-value';

        // Format and display ROI
        const roiElement = document.getElementById('roi');
        roiElement.textContent = `${this.formatDecimal(roiPercent, 2)}%`;
        roiElement.className = 'result-value';
        if (roiPercent > 0) {
            roiElement.classList.add('positive');
        } else if (roiPercent < 0) {
            roiElement.classList.add('negative');
        }

        // Format and display Multiplier with commas for large numbers
        const multiplierDisplay = multiplier >= 1000 
            ? this.formatNumber(Math.round(multiplier)) + 'x'
            : this.formatDecimal(multiplier, 2) + 'x';
        document.getElementById('multiplier').textContent = multiplierDisplay;

        // Show results section
        document.getElementById('resultsSection').classList.add('visible');

        // Show generate card button
        document.getElementById('generateCardBtn').classList.add('visible');
    },

    // Generate shareable PnL card using native Canvas API
    generateCard() {
        if (!this.calculatedData) {
            this.showError('Please calculate PnL first');
            return;
        }

        const { entryAmount, entryMarketCap, targetMarketCap, profitSOL, profitUSD, roiPercent, multiplier } = this.calculatedData;

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1200;
        canvas.height = 630;

        // Background (premium black gradient)
        const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bg.addColorStop(0, '#000000');
        bg.addColorStop(1, '#111827');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle diagonal stripe overlay
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = -canvas.height; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Title
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QuantCalc', canvas.width / 2, 110);

        // Subtitle
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Arial';
        ctx.fillText('Solana Token Market Cap PnL Analyzer', canvas.width / 2, 160);

        // Stats Section
        ctx.font = '24px Arial';
        ctx.fillStyle = '#9ca3af';

        const startY = 240;
        const lineGap = 50;

        const formattedEntryCap = '$' + this.formatNumber(Math.round(entryMarketCap));
        const formattedTargetCap = '$' + this.formatNumber(Math.round(targetMarketCap));
        const formattedMultiplier = multiplier >= 1000 
            ? this.formatNumber(Math.round(multiplier)) + 'x'
            : this.formatDecimal(multiplier, 2) + 'x';
        const formattedProfitUSD = '$' + this.formatNumber(Math.round(profitUSD));

        const stats = [
            `Entry Market Cap: ${formattedEntryCap}`,
            `Target Market Cap: ${formattedTargetCap}`,
            `Multiplier: ${formattedMultiplier}`,
            `Entry Amount: ${this.formatDecimal(entryAmount, 4)} SOL`,
            `Projected Profit: ${this.formatDecimal(profitSOL, 4)} SOL`,
            `Projected Profit: ${formattedProfitUSD}`,
            `ROI: ${this.formatDecimal(roiPercent, 2)}%`
        ];

        stats.forEach((line, i) => {
            ctx.fillText(line, canvas.width / 2, startY + (i * lineGap));
        });

        // Funny Quotes
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];

        ctx.fillStyle = '#22c55e';
        ctx.font = 'italic 28px Arial';
        ctx.fillText(`"${randomQuote}"`, canvas.width / 2, 580);

        // Timestamp
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        ctx.fillStyle = '#6b7280';
        ctx.font = '20px Arial';
        ctx.fillText(timestamp, canvas.width / 2, 610);

        // Website Footer
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('www.quantcalc.trade', canvas.width / 2, 640);

        // Trigger download
        const imageData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'quantcalc-pnl.png';
        link.click();
    }
};

// Initialize calculator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MemeProfitCalculator.init());
} else {
    MemeProfitCalculator.init();
}
