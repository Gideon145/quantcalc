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

        // Create canvas (vertical layout)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1080;
        canvas.height = 1350;

        // Background (premium vertical gradient)
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#000000');
        bg.addColorStop(1, '#0f172a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle diagonal stripe overlay
        ctx.globalAlpha = 0.05;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = -canvas.height; i < canvas.width + canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Header: Title
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QuantCalc', canvas.width / 2, 120);

        // Header: Subtitle
        ctx.fillStyle = '#ffffff';
        ctx.font = '36px Arial';
        ctx.fillText('The #1 Solana Math Toolkit', canvas.width / 2, 180);

        // Solana gradient bar icon (3 small rounded rectangles)
        const barY = 220;
        const barWidth = 60;
        const barHeight = 12;
        const barGap = 10;
        const totalBarWidth = (barWidth * 3) + (barGap * 2);
        const barStartX = (canvas.width - totalBarWidth) / 2;

        const gradient1 = ctx.createLinearGradient(barStartX, barY, barStartX + barWidth, barY);
        gradient1.addColorStop(0, '#14f195');
        gradient1.addColorStop(1, '#9945ff');

        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = gradient1;
            const x = barStartX + (i * (barWidth + barGap));
            ctx.beginPath();
            ctx.roundRect(x, barY, barWidth, barHeight, 6);
            ctx.fill();
        }

        // Helper function to draw rounded stat box
        const drawStatBox = (x, y, label, value) => {
            const boxWidth = 420;
            const boxHeight = 120;
            const radius = 12;

            // Draw box background
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.roundRect(x - boxWidth / 2, y, boxWidth, boxHeight, radius);
            ctx.fill();

            // Draw box border
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            ctx.fillStyle = '#9ca3af';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y + 40);

            // Draw value
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(value, x, y + 85);
        };

        // Format values
        const formattedEntryCap = '$' + this.formatNumber(Math.round(entryMarketCap));
        const formattedTargetCap = '$' + this.formatNumber(Math.round(targetMarketCap));
        const formattedMultiplier = multiplier >= 1000 
            ? this.formatNumber(Math.round(multiplier)) + 'x'
            : this.formatDecimal(multiplier, 2) + 'x';
        const formattedProfitUSD = '$' + this.formatNumber(Math.round(profitUSD));
        const formattedEntryAmount = this.formatDecimal(entryAmount, 4) + ' SOL';
        const formattedProfitSOL = this.formatDecimal(profitSOL, 4) + ' SOL';

        // Two-column stats grid
        const leftX = 270;
        const rightX = canvas.width - 270;
        const startY = 300;
        const rowGap = 160;

        // Row 1
        drawStatBox(leftX, startY, 'Entry Market Cap', formattedEntryCap);
        drawStatBox(rightX, startY, 'Target Market Cap', formattedTargetCap);

        // Row 2
        drawStatBox(leftX, startY + rowGap, 'Entry Amount', formattedEntryAmount);
        drawStatBox(rightX, startY + rowGap, 'Projected Profit (SOL)', formattedProfitSOL);

        // Row 3
        drawStatBox(leftX, startY + (rowGap * 2), 'Projected Profit (USD)', formattedProfitUSD);
        drawStatBox(rightX, startY + (rowGap * 2), 'Multiplier', formattedMultiplier);

        // Big ROI Section
        const roiY = 900;
        const roiBoxWidth = 700;
        const roiBoxHeight = 160;

        // Draw ROI box
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect((canvas.width - roiBoxWidth) / 2, roiY, roiBoxWidth, roiBoxHeight, 16);
        ctx.fill();

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // ROI Label
        ctx.fillStyle = '#9ca3af';
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ROI', canvas.width / 2, roiY + 45);

        // ROI Value
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 96px Arial';
        ctx.fillText(this.formatDecimal(roiPercent, 2) + '%', canvas.width / 2, roiY + 130);

        // Funny Quote
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        ctx.fillStyle = '#22c55e';
        ctx.font = 'italic 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`"${randomQuote}"`, canvas.width / 2, 1120);

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
        ctx.font = '22px Arial';
        ctx.fillText(timestamp, canvas.width / 2, 1180);

        // Website Footer (right aligned)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('www.quantcalc.trade', canvas.width - 40, canvas.height - 40);

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
