// Pump.fun Break-Even Calculator Logic
const PumpBreakEvenCalculator = {
    // Initialize calculator
    init() {
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        const calculateBtn = document.getElementById('calculateBtn');
        calculateBtn.addEventListener('click', () => this.calculate());
        
        // Allow Enter key to trigger calculation
        const inputs = document.querySelectorAll('.input-field');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calculate();
                }
            });
        });
    },
    
    // Main calculation function
    calculate() {
        this.hideError();
        
        // Get simplified input values
        const entryAmount = parseFloat(document.getElementById('entryAmount').value);
        const estimatedFees = parseFloat(document.getElementById('estimatedFees').value) || 0;
        const extraFees = parseFloat(document.getElementById('extraFees').value) || 0;
        
        // Validate inputs
        if (!entryAmount || entryAmount <= 0) {
            this.showError('Please enter a valid entry amount.');
            return;
        }
        
        if (estimatedFees < 0 || estimatedFees > 100) {
            this.showError('Estimated fees must be between 0 and 100%.');
            return;
        }
        
        if (extraFees < 0) {
            this.showError('Extra fees cannot be negative.');
            return;
        }
        
        // Calculate break-even
        const results = this.calculateBreakEven(entryAmount, estimatedFees, extraFees);
        
        // Display results
        this.displayResults(results);
    },
    
    // Calculate break-even logic
    calculateBreakEven(entrySOL, estimatedFeePercent, extraSOLFees) {
        // Calculate fee from percentage
        const feeFromPercent = entrySOL * (estimatedFeePercent / 100);
        
        // Total cost
        const totalCost = entrySOL + feeFromPercent + extraSOLFees;
        
        // Break-even multiplier
        const breakEvenMultiplier = totalCost / entrySOL;
        
        // Required increase percentage
        const requiredIncreasePercent = (breakEvenMultiplier - 1) * 100;
        
        // Break-even SOL target
        const breakEvenSOL = totalCost;
        
        return {
            entryAmount: entrySOL,
            estimatedFeesSOL: feeFromPercent,
            extraFeesSOL: extraSOLFees,
            totalCost: totalCost,
            multiplier: breakEvenMultiplier,
            requiredIncrease: requiredIncreasePercent,
            breakEvenTarget: breakEvenSOL
        };
    },
    
    // Display results
    displayResults(results) {
        // Main results
        document.getElementById('multiplier').textContent = results.multiplier.toFixed(2) + 'x';
        document.getElementById('requiredIncrease').textContent = results.requiredIncrease.toFixed(2) + '%';
        document.getElementById('breakEvenTarget').textContent = results.breakEvenTarget.toFixed(4) + ' SOL';
        
        // Breakdown
        document.getElementById('breakdownEntry').textContent = results.entryAmount.toFixed(4) + ' SOL';
        document.getElementById('breakdownEstimatedFees').textContent = results.estimatedFeesSOL.toFixed(4) + ' SOL';
        document.getElementById('breakdownExtraFees').textContent = results.extraFeesSOL.toFixed(4) + ' SOL';
        document.getElementById('breakdownTotal').textContent = results.totalCost.toFixed(4) + ' SOL';
        document.getElementById('breakdownMultiplier').textContent = results.multiplier.toFixed(2) + 'x';
        document.getElementById('breakdownIncrease').textContent = results.requiredIncrease.toFixed(2) + '%';
        document.getElementById('warningPercent').textContent = results.requiredIncrease.toFixed(2) + '%';
        
        // Show sections with animation
        const resultsSection = document.getElementById('resultsSection');
        const breakdownSection = document.getElementById('breakdownSection');
        resultsSection.classList.add('visible');
        breakdownSection.classList.add('visible');
        
        // Scroll to results smoothly
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    
    // Show error message
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.add('visible');
        
        // Hide results if showing
        document.getElementById('resultsSection').classList.remove('visible');
        document.getElementById('breakdownSection').classList.remove('visible');
    },
    
    // Hide error message
    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.remove('visible');
    }
};

// Toggle Advanced Settings
function toggleAdvanced() {
    const content = document.getElementById('advancedContent');
    const icon = document.getElementById('advancedIcon');
    content.classList.toggle('active');
    icon.classList.toggle('open');
}

// Initialize calculator when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PumpBreakEvenCalculator.init();
        initPageTransitions();
    });
} else {
    PumpBreakEvenCalculator.init();
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
