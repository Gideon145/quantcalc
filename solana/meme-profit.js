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
        
        const copyResultsBtn = document.getElementById('copyResultsBtn');
        copyResultsBtn.addEventListener('click', () => this.copyResults());

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

    // Generate shareable PnL card using native Canvas API - REBUILT FROM SCRATCH
    generateCard() {
        if (!this.calculatedData) {
            this.showError('Please calculate PnL first');
            return;
        }

        const { entryAmount, entryMarketCap, targetMarketCap, profitSOL, profitUSD, roiPercent, multiplier } = this.calculatedData;

        // Get token name (optional)
        const tokenNameInput = document.getElementById('tokenName');
        const tokenName = tokenNameInput && tokenNameInput.value.trim() 
            ? tokenNameInput.value.trim() 
            : 'Solana Token';

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1080;
        canvas.height = 1350; // Auto-determined by content

        // ========================================
        // BACKGROUND
        // ========================================
        const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bg.addColorStop(0, '#000000');
        bg.addColorStop(1, '#0a0f1e');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Diagonal stripe overlay
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = -canvas.height; i < canvas.width + canvas.height; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + canvas.height, canvas.height);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // ========================================
        // HEADER SECTION
        // ========================================
        const headerY = 80;

        // Title
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QuantCalc', canvas.width / 2, headerY);

        // Subtitle
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '32px Arial';
        ctx.fillText('The #1 Solana Math Toolkit', canvas.width / 2, headerY + 55);

        // Solana logo bars
        const barY = headerY + 95;
        const barWidth = 50;
        const barHeight = 10;
        const barGap = 8;
        const totalBarWidth = (barWidth * 3) + (barGap * 2);
        const barStartX = (canvas.width - totalBarWidth) / 2;

        const solGradient = ctx.createLinearGradient(barStartX, barY, barStartX + totalBarWidth, barY);
        solGradient.addColorStop(0, '#14f195');
        solGradient.addColorStop(1, '#9945ff');

        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = solGradient;
            const x = barStartX + (i * (barWidth + barGap));
            ctx.beginPath();
            ctx.roundRect(x, barY, barWidth, barHeight, 5);
            ctx.fill();
        }

        // Token name
        const tokenNameY = barY + 60;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(tokenName.toUpperCase(), canvas.width / 2, tokenNameY);

        // ========================================
        // GRID LAYOUT - REBUILT FROM SCRATCH
        // Grid: 2 columns, 32px gaps
        // ========================================
        const gridStartY = tokenNameY + 60; // 60px padding after token name
        const boxWidth = 434; // (900 - 32) / 2 for 900px container with 32px gap
        const boxHeight = 110;
        const columnGap = 32;
        const rowGap = 32;
        
        // Center grid (900px width container)
        const gridContainerWidth = 900;
        const gridLeftMargin = (canvas.width - gridContainerWidth) / 2; // 90px
        
        const col1X = gridLeftMargin;
        const col2X = gridLeftMargin + boxWidth + columnGap;

        // Helper function to draw stat box
        const drawStatBox = (x, y, label, value) => {
            const radius = 14;

            // Box background
            ctx.fillStyle = '#0f1419';
            ctx.beginPath();
            ctx.roundRect(x, y, boxWidth, boxHeight, radius);
            ctx.fill();

            // Box border
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            ctx.fillStyle = '#9ca3af';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + boxWidth / 2, y + 35);

            // Value
            ctx.fillStyle = '#f9fafb';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(value, x + boxWidth / 2, y + 75);
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

        // Row 1: Entry MC | Target MC
        const row1Y = gridStartY;
        drawStatBox(col1X, row1Y, 'Entry Market Cap', formattedEntryCap);
        drawStatBox(col2X, row1Y, 'Target Market Cap', formattedTargetCap);

        // Row 2: Entry Amount | Profit SOL
        const row2Y = row1Y + boxHeight + rowGap;
        drawStatBox(col1X, row2Y, 'Entry Amount', formattedEntryAmount);
        drawStatBox(col2X, row2Y, 'Projected Profit (SOL)', formattedProfitSOL);

        // Row 3: Profit USD | Multiplier
        const row3Y = row2Y + boxHeight + rowGap;
        drawStatBox(col1X, row3Y, 'Projected Profit (USD)', formattedProfitUSD);
        drawStatBox(col2X, row3Y, 'Multiplier', formattedMultiplier);

        // ========================================
        // ROI BOX (full width)
        // 20px margin-top, 24px margin-bottom
        // ========================================
        const roiY = row3Y + boxHeight + 20;
        const roiBoxWidth = gridContainerWidth;
        const roiBoxHeight = 160;
        const roiBoxX = (canvas.width - roiBoxWidth) / 2;

        // ROI box background
        ctx.fillStyle = '#0f1419';
        ctx.beginPath();
        ctx.roundRect(roiBoxX, roiY, roiBoxWidth, roiBoxHeight, 18);
        ctx.fill();

        // ROI box border with glow
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.3)';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // ROI label
        ctx.fillStyle = '#9ca3af';
        ctx.font = '26px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ROI', canvas.width / 2, roiY + 50);

        // ROI value
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 88px Arial';
        ctx.fillText(this.formatDecimal(roiPercent, 2) + '%', canvas.width / 2, roiY + 125);

        // ========================================
        // BOTTOM SECTION
        // ========================================
        const quoteY = roiY + roiBoxHeight + 40;

        // Quote
        const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
        ctx.fillStyle = '#10b981';
        ctx.font = 'italic 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`"${randomQuote}"`, canvas.width / 2, quoteY);

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
        ctx.font = '19px Arial';
        ctx.fillText(timestamp, canvas.width / 2, quoteY + 40);

        // Website footer (bottom-right)
        const footerY = quoteY + 100; // 60px below timestamp
        ctx.fillStyle = '#3b82f6';
        ctx.font = '600 28px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('www.qunancalc.trade', canvas.width - 40, footerY);

        // ========================================
        // EXPORT PNG
        // ========================================
        const imageData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageData;
        link.download = 'quantcalc-pnl.png';
        link.click();
    }
};

// Toggle "How This Works" section
function toggleHowItWorks() {
    const content = document.getElementById("howContent");
    content.classList.toggle("active");
}

// Copy results to clipboard
MemeProfitCalculator.copyResults = function() {
    if (!this.calculatedData) {
        this.showToast('No results to copy');
        return;
    }
    
    const data = this.calculatedData;
    const tokenName = document.getElementById('tokenName').value || 'N/A';
    const entryMC = document.getElementById('entryMarketCap').value;
    const targetMC = document.getElementById('targetMarketCap').value;
    
    const text = `QuantCalc – Solana Token PnL\n\nToken: ${tokenName}\nEntry MC: $${entryMC}\nTarget MC: $${targetMC}\nMultiplier: ${data.multiplier.toFixed(2)}x\nEntry: ${data.entryAmount.toFixed(4)} SOL\nProjected Profit: ${data.profitSOL.toFixed(4)} SOL\nROI: ${data.roi.toFixed(2)}%\n\nGenerated via quantcalc.trade`;
    
    navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard');
    }).catch(() => {
        this.showToast('Failed to copy');
    });
};

// Show toast notification
MemeProfitCalculator.showToast = function(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
};

// Initialize calculator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        MemeProfitCalculator.init();
        initPageTransitions();
    });
} else {
    MemeProfitCalculator.init();
    initPageTransitions();
}

// Smooth page transitions
function initPageTransitions() {
    const links = document.querySelectorAll('a:not([target="_blank"])');
    
    links.forEach(link => {
        if (link.classList.contains('tool-btn-disabled') || link.getAttribute('href')?.startsWith('#')) {
            return;
        }
        
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href && !href.startsWith('http') && !href.startsWith('//')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            }
        });
    });
}
