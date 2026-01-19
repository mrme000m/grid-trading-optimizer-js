/**
 * Grid Trading Optimizer Pro - Main Application Logic
 * Handles configuration, analysis, optimization loops, and deployment
 */

// Google AI Models with Pricing Information
const GOOGLE_MODELS = {
    'gemini-2.0-flash': {
        name: 'Gemini 2.0 Flash',
        description: 'Fastest model for real-time analysis',
        latency: '2-3s',
        contextWindow: '1M tokens',
        pricing: {
            input: 0.075,        // $0.075 per 1M input tokens
            output: 0.3,         // $0.3 per 1M output tokens
            cacheWrite: 0.225,   // $0.225 per 1M cache write tokens
            cacheRead: 0.0225    // $0.0225 per 1M cache read tokens
        },
        recommended: true
    },
    'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        description: 'Advanced reasoning capabilities',
        latency: '5-8s',
        contextWindow: '2M tokens',
        pricing: {
            input: 3.5,
            output: 10.5,
            cacheWrite: 10.5,
            cacheRead: 0.525
        },
        recommended: false
    },
    'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        description: 'Cost-efficient for high volume',
        latency: '3-4s',
        contextWindow: '1M tokens',
        pricing: {
            input: 0.375,
            output: 1.5,
            cacheWrite: 1.5,
            cacheRead: 0.0375
        },
        recommended: false
    }
};

// Technical Indicator Calculations
class TechnicalIndicators {
    static calculateATR(candles, period = 14) {
        if (!candles || candles.length < period + 1) return 0;
        
        let trSum = 0;
        for (let i = 1; i <= period; i++) {
            const curr = candles[candles.length - i];
            const prev = candles[candles.length - i - 1];
            
            const tr1 = curr.high - curr.low;
            const tr2 = Math.abs(curr.high - prev.close);
            const tr3 = Math.abs(curr.low - prev.close);
            
            trSum += Math.max(tr1, tr2, tr3);
        }
        
        return trSum / period;
    }

    static calculateBollingerBands(closes, period = 20, stdev = 2.0) {
        if (!closes || closes.length < period) return null;
        
        const recent = closes.slice(-period);
        const mean = recent.reduce((a, b) => a + b) / period;
        const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2)) / period;
        const stdDev = Math.sqrt(variance);
        
        return {
            upper: mean + stdev * stdDev,
            middle: mean,
            lower: mean - stdev * stdDev,
            width_percent: (2 * stdev * stdDev / mean) * 100
        };
    }

    static calculateVolumeProfile(candles, bins = 60) {
        if (!candles || candles.length < 20) return null;
        
        const closes = candles.map(c => c.close);
        const volumes = candles.map(c => c.volume);
        
        const minPrice = Math.min(...closes);
        const maxPrice = Math.max(...closes);
        const binWidth = (maxPrice - minPrice) / bins;
        
        const histogram = Array(bins).fill(0);
        
        for (let i = 0; i < closes.length; i++) {
            const binIdx = Math.floor((closes[i] - minPrice) / binWidth);
            histogram[Math.min(binIdx, bins - 1)] += volumes[i];
        }
        
        const pocIdx = histogram.indexOf(Math.max(...histogram));
        const pocPrice = minPrice + (pocIdx + 0.5) * binWidth;
        
        return {
            poc_price: pocPrice,
            value_area_low: minPrice,
            value_area_high: maxPrice,
            bins: bins
        };
    }

    static calculateADX(candles, period = 14) {
        if (!candles || candles.length < period + 2) {
            return { adx: 0, plus_di: 0, minus_di: 0 };
        }
        
        let plusDmSum = 0, minusDmSum = 0, trSum = 0;
        
        for (let i = 1; i <= period; i++) {
            const curr = candles[candles.length - i];
            const prev = candles[candles.length - i - 1];
            
            const upMove = curr.high - prev.high;
            const downMove = prev.low - curr.low;
            
            if (upMove > 0 && upMove > downMove) plusDmSum += upMove;
            if (downMove > 0 && downMove > upMove) minusDmSum += downMove;
            
            const tr1 = curr.high - curr.low;
            const tr2 = Math.abs(curr.high - prev.close);
            const tr3 = Math.abs(curr.low - prev.close);
            trSum += Math.max(tr1, tr2, tr3);
        }
        
        const atrVal = trSum / period;
        const plusDI = (plusDmSum / atrVal) * 100;
        const minusDI = (minusDmSum / atrVal) * 100;
        const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 || 0;
        
        return {
            adx: dx,
            plus_di: plusDI,
            minus_di: minusDI
        };
    }
}

// Cost Calculator for Google AI API
class CostCalculator {
    constructor(model = 'gemini-2.0-flash') {
        this.model = model;
        this.modelInfo = GOOGLE_MODELS[model];
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
        this.cacheHitRate = 0;
    }

    estimatePromptTokens(context) {
        // Rough estimate: ~1 token per 4 characters
        const jsonStr = JSON.stringify(context);
        return Math.ceil(jsonStr.length / 4);
    }

    estimateOutputTokens(gridCount = 20, orderCount = 50) {
        // Rough estimate for grid plan JSON output
        return Math.ceil(gridCount * 150 + orderCount * 50);
    }

    calculateCost(inputTokens, outputTokens, cacheRead = 0) {
        const pricing = this.modelInfo.pricing;
        
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        const cacheCost = (cacheRead / 1_000_000) * pricing.cacheRead;
        
        return {
            input_cost: inputCost,
            output_cost: outputCost,
            cache_cost: cacheCost,
            total_cost: inputCost + outputCost + cacheCost,
            currency: 'USD'
        };
    }

    getCostBreakdown(context, gridCount, orderCount) {
        const inputTokens = this.estimatePromptTokens(context);
        const outputTokens = this.estimateOutputTokens(gridCount, orderCount);
        const cacheRead = Math.floor(inputTokens * this.cacheHitRate);
        
        this.totalInputTokens += inputTokens;
        this.totalOutputTokens += outputTokens;
        
        return {
            model: this.model,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cache_read_tokens: cacheRead,
            cache_hit_rate: this.cacheHitRate,
            ...this.calculateCost(inputTokens, outputTokens, cacheRead)
        };
    }

    getTotalCost() {
        const pricing = this.modelInfo.pricing;
        const cacheRead = Math.floor(this.totalInputTokens * this.cacheHitRate);
        
        return {
            model: this.model,
            total_input_tokens: this.totalInputTokens,
            total_output_tokens: this.totalOutputTokens,
            total_cache_read: cacheRead,
            ...this.calculateCost(this.totalInputTokens, this.totalOutputTokens, cacheRead)
        };
    }
}

// Grid Plan Generator
class GridPlanner {
    constructor(config) {
        this.config = config;
        this.plans = [];
        this.costCalculator = new CostCalculator(config.selectedModel || 'gemini-2.0-flash');
    }

    async generatePlanForCoin(coin, currentPrice, indicators, portfolio) {
        const constraints = this.config.constraints || {};
        const atr = indicators.atr || 0;
        const volatilityMultiplier = atr > 0 ? Math.min(1.5, Math.max(0.8, atr / currentPrice)) : 1.1;
        
        // Calculate grid bounds
        const minGridLevels = constraints.min_grid_levels || 10;
        const maxGridLevels = constraints.max_grid_levels || 25;
        const gridCount = Math.floor((minGridLevels + maxGridLevels) / 2);
        
        const minSpacing = (constraints.min_spacing_percent || 0.25) / 100;
        const maxSpacing = (constraints.max_spacing_percent || 2.0) / 100;
        const spacing = Math.min(maxSpacing, Math.max(minSpacing, (atr * volatilityMultiplier) / currentPrice));
        
        const lower = currentPrice * (1 - (spacing * gridCount) / 2);
        const upper = currentPrice * (1 + (spacing * gridCount) / 2);
        
        const levels = this.generateLevels(lower, upper, gridCount);
        
        // Generate orders
        const perOrderBudget = (constraints.per_coin_quote_budget_percent || 20) / 100 / gridCount;
        const orders = this.generateOrders(levels, currentPrice, perOrderBudget);
        
        const plan = {
            coin: coin,
            symbol: `${coin}/USDT`,
            status: 'ok',
            generator: 'heuristic',
            timestamp: new Date().toISOString(),
            grid: {
                lower: lower,
                upper: upper,
                grid_count: gridCount,
                spacing_type: 'adaptive',
                spacing_percent: spacing * 100,
                levels: levels,
                rationale: `ATR-based adaptive spacing (${spacing.toFixed(4)}% per level, volatility multiplier: ${volatilityMultiplier.toFixed(2)}x)`
            },
            orders: {
                limit_orders: orders.limit,
                stop_limit_orders: orders.stop
            },
            activation: {
                enable_if: indicators.consolidation ? ['consolidation'] : [],
                disable_if: indicators.strong_trend ? ['strong_trend'] : []
            },
            metrics: {
                current_price: currentPrice,
                price_position_percent: ((currentPrice - lower) / (upper - lower)) * 100,
                grid_range_percent: ((upper - lower) / currentPrice) * 100,
                estimated_capital: this.estimateCapital(orders.limit)
            },
            notes: `Generated at ${new Date().toLocaleString()}`
        };
        
        this.plans.push(plan);
        return plan;
    }

    generateLevels(lower, upper, count) {
        const levels = [];
        for (let i = 0; i < count; i++) {
            levels.push(lower + ((upper - lower) * i) / (count - 1));
        }
        return levels;
    }

    generateOrders(levels, currentPrice, budgetPerLevel) {
        const limitOrders = [];
        const stopOrders = [];
        
        for (const level of levels) {
            const side = level < currentPrice ? 'buy' : 'sell';
            const amount = Math.max(1e-8, budgetPerLevel / level);
            
            limitOrders.push({
                side: side,
                price: parseFloat(level.toFixed(8)),
                amount: parseFloat(amount.toFixed(8)),
                type: 'limit'
            });
        }
        
        return { limit: limitOrders, stop: stopOrders };
    }

    estimateCapital(orders) {
        return orders.reduce((total, order) => {
            return total + (order.price * order.amount);
        }, 0);
    }
}

// Main Application Controller
class GridTradingApp {
    constructor() {
        this.config = this.getDefaultConfig();
        this.planner = new GridPlanner(this.config);
        this.optimizationLoop = null;
        this.isOptimizing = false;
        this.iterationCount = 0;
        this.maxIterations = 5;
        this.loopInterval = 30000; // 30 seconds
        this.mockPortfolio = this.generateMockPortfolio();
        this.mockCandles = this.generateMockCandles();
        this.initializeUI();
    }

    getDefaultConfig() {
        return {
            exchange: 'KuCoin',
            selectedModel: 'gemini-2.0-flash',
            enableLLM: true,
            analysis: {
                atr_period: 14,
                bb_period: 20,
                bb_stdev: 2.0,
                vpvr_bins: 60,
                consolidation_max_range_pct: 3.0,
                timeframes: ['1d', '4h', '1h', '30m', '5m']
            },
            constraints: {
                min_grid_levels: 10,
                max_grid_levels: 25,
                min_spacing_percent: 0.25,
                max_spacing_percent: 2.0,
                per_coin_quote_budget_percent: 20,
                reserve_quote_percent: 30
            },
            llm: {
                temperature: 0.2
            }
        };
    }

    generateMockPortfolio() {
        const coins = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL', 'DOGE'];
        const portfolio = {};
        
        coins.forEach(coin => {
            portfolio[coin] = {
                free: Math.random() * 10,
                used: Math.random() * 2,
                total: Math.random() * 12
            };
        });
        
        return portfolio;
    }

    generateMockCandles(symbol = 'BTC/USDT', count = 100) {
        const candles = [];
        let price = 45000;
        
        for (let i = 0; i < count; i++) {
            const change = (Math.random() - 0.5) * 2000;
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) * (1 + Math.random() * 0.005);
            const low = Math.min(open, close) * (1 - Math.random() * 0.005);
            const volume = Math.random() * 1000;
            
            candles.push({ open, high, low, close, volume });
            price = close;
        }
        
        return candles;
    }

    initializeUI() {
        this.renderModels();
        this.updateStats();
        this.loadDefaultConfig();
    }

    renderModels() {
        const container = document.getElementById('modelsContainer');
        container.innerHTML = '';
        
        Object.entries(GOOGLE_MODELS).forEach(([modelId, modelData]) => {
            const card = document.createElement('div');
            card.className = `model-card ${modelId === this.config.selectedModel ? 'selected' : ''}`;
            card.onclick = () => this.selectModel(modelId);
            
            card.innerHTML = `
                <div class="model-name">${modelData.name}</div>
                <div class="model-info">
                    <p>${modelData.description}</p>
                    <p><strong>Latency:</strong> ${modelData.latency}</p>
                    <p><strong>Context:</strong> ${modelData.contextWindow}</p>
                </div>
                <div class="model-cost">
                    Input: $${modelData.pricing.input}/1M | Output: $${modelData.pricing.output}/1M
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    selectModel(modelId) {
        this.config.selectedModel = modelId;
        this.planner.costCalculator = new CostCalculator(modelId);
        this.renderModels();
        this.showToast(`Switched to ${GOOGLE_MODELS[modelId].name}`, 'success');
    }

    loadDefaultConfig() {
        document.getElementById('atrPeriod').value = this.config.analysis.atr_period;
        document.getElementById('bbPeriod').value = this.config.analysis.bb_period;
        document.getElementById('vpvrBins').value = this.config.analysis.vpvr_bins;
        document.getElementById('minGridLevels').value = this.config.constraints.min_grid_levels;
        document.getElementById('maxGridLevels').value = this.config.constraints.max_grid_levels;
        document.getElementById('llmTemp').value = this.config.llm.temperature;
        document.getElementById('enableLLM').checked = this.config.enableLLM;
    }

    saveConfig() {
        this.config.analysis.atr_period = parseInt(document.getElementById('atrPeriod').value);
        this.config.analysis.bb_period = parseInt(document.getElementById('bbPeriod').value);
        this.config.analysis.vpvr_bins = parseInt(document.getElementById('vpvrBins').value);
        this.config.constraints.min_grid_levels = parseInt(document.getElementById('minGridLevels').value);
        this.config.constraints.max_grid_levels = parseInt(document.getElementById('maxGridLevels').value);
        this.config.llm.temperature = parseFloat(document.getElementById('llmTemp').value);
        this.config.enableLLM = document.getElementById('enableLLM').checked;
        
        this.planner = new GridPlanner(this.config);
        this.showToast('Configuration saved successfully', 'success');
    }

    handleConfigUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.config = { ...this.config, ...config };
                this.planner = new GridPlanner(this.config);
                
                // Show preview
                const preview = document.getElementById('configPreview');
                preview.textContent = JSON.stringify(config, null, 2);
                preview.style.display = 'block';
                
                this.loadDefaultConfig();
                this.showToast('Configuration loaded successfully', 'success');
            } catch (err) {
                this.showToast(`Error parsing config: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    async startOptimization() {
        if (this.isOptimizing) return;
        
        this.isOptimizing = true;
        document.getElementById('startBtn').disabled = true;
        
        this.updateDeploymentCheck('checkKuCoin', 'ready');
        this.updateDeploymentCheck('checkGCloud', 'ready');
        
        this.planner.plans = [];
        
        const coins = Object.keys(this.mockPortfolio);
        let gridCount = 0;
        
        for (const coin of coins) {
            this.showToast(`Analyzing ${coin}...`, 'info');
            
            // Simulate analysis delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Calculate indicators
            const indicators = {
                atr: TechnicalIndicators.calculateATR(this.mockCandles),
                bb: TechnicalIndicators.calculateBollingerBands(this.mockCandles.map(c => c.close)),
                vp: TechnicalIndicators.calculateVolumeProfile(this.mockCandles),
                adx: TechnicalIndicators.calculateADX(this.mockCandles),
                consolidation: Math.random() > 0.6,
                strong_trend: Math.random() > 0.7
            };
            
            const currentPrice = this.mockCandles[this.mockCandles.length - 1].close;
            
            // Generate plan
            const plan = await this.planner.generatePlanForCoin(
                coin,
                currentPrice,
                indicators,
                this.mockPortfolio[coin]
            );
            
            gridCount += plan.grid.grid_count;
        }
        
        this.updateDeploymentCheck('checkPlans', 'ready');
        this.updateDeploymentCheck('checkCost', 'ready');
        
        this.updateStats(coins.length, gridCount);
        this.renderPlans();
        this.updateCostBreakdown();
        
        this.isOptimizing = false;
        document.getElementById('startBtn').disabled = false;
        this.showToast(`Analysis complete! ${coins.length} coins analyzed.`, 'success');
    }

    async startOptimizationLoop() {
        if (this.optimizationLoop) return;
        
        this.iterationCount = 0;
        const indicator = document.getElementById('loopIndicator');
        indicator.classList.add('active');
        
        const runOptimization = async () => {
            if (this.iterationCount >= this.maxIterations) {
                this.stopOptimizationLoop();
                return;
            }
            
            this.iterationCount++;
            document.getElementById('iterationCount').textContent = this.iterationCount;
            document.getElementById('lastRun').textContent = new Date().toLocaleTimeString();
            
            const progress = (this.iterationCount / this.maxIterations) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            
            document.getElementById('loopStatus').textContent = `Running iteration ${this.iterationCount} of ${this.maxIterations}`;
            
            await this.startOptimization();
            
            this.optimizationLoop = setTimeout(runOptimization, this.loopInterval);
        };
        
        await runOptimization();
        this.showToast('Optimization loop started', 'success');
    }

    stopOptimizationLoop() {
        if (this.optimizationLoop) {
            clearTimeout(this.optimizationLoop);
            this.optimizationLoop = null;
        }
        
        document.getElementById('loopIndicator').classList.remove('active');
        document.getElementById('loopStatus').textContent = `Loop completed - ${this.iterationCount} iterations`;
        this.showToast('Optimization loop stopped', 'info');
    }

    renderPlans() {
        const container = document.getElementById('plansContainer');
        container.innerHTML = '';
        
        if (this.planner.plans.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 40px 0;">No plans available</p>';
            return;
        }
        
        this.planner.plans.forEach(plan => {
            const gridDiv = document.createElement('div');
            gridDiv.className = 'grid-plan';
            
            const currentPrice = plan.metrics.current_price;
            const lower = plan.grid.lower;
            const upper = plan.grid.upper;
            const levels = plan.grid.levels || [];
            
            let levelsHTML = '';
            levels.slice(-5).forEach(level => {
                const side = level < currentPrice ? 'buy' : 'sell';
                const pct = ((level - currentPrice) / currentPrice) * 100;
                levelsHTML += `
                    <div class="level-bar">
                        <div class="level-bar-visual ${side === 'buy' ? 'level-buy' : 'level-sell'}">
                            <div class="level-current" style="left: ${((level - lower) / (upper - lower)) * 100}%"></div>
                        </div>
                        <div class="level-info">${side.toUpperCase()} ${level.toFixed(2)} (${pct.toFixed(2)}%)</div>
                    </div>
                `;
            });
            
            gridDiv.innerHTML = `
                <div class="grid-header">
                    <div>
                        <div class="grid-coin">${plan.coin}</div>
                        <div style="font-size: 12px; color: var(--color-text-secondary);">Current: $${currentPrice.toFixed(2)}</div>
                    </div>
                    <div class="grid-status status-ok">✓ Ready</div>
                </div>
                <div class="grid-levels" style="max-height: 120px; overflow-y: auto;">
                    ${levelsHTML}
                </div>
                <div style="font-size: 11px; color: var(--color-text-muted); margin-top: 10px;">
                    <div>Grid: ${plan.grid.grid_count} levels | Range: ${plan.grid.lower.toFixed(2)} - ${plan.grid.upper.toFixed(2)}</div>
                    <div>Capital: $${plan.metrics.estimated_capital.toFixed(2)} | Position: ${plan.metrics.price_position_percent.toFixed(1)}%</div>
                </div>
            `;
            
            container.appendChild(gridDiv);
        });
    }

    updateStats(coins = 0, grids = 0) {
        document.getElementById('coinsCount').textContent = coins || Object.keys(this.mockPortfolio).length;
        document.getElementById('gridsCount').textContent = grids || this.planner.plans.reduce((sum, p) => sum + p.grid.grid_count, 0);
        document.getElementById('apiCallsCount').textContent = (coins || 0) + ' calls';
    }

    updateCostBreakdown() {
        const costBreakdown = this.planner.costCalculator.getTotalCost();
        
        document.getElementById('inputTokens').textContent = (costBreakdown.total_input_tokens / 1000).toFixed(1) + 'K';
        document.getElementById('outputTokens').textContent = (costBreakdown.total_output_tokens / 1000).toFixed(1) + 'K';
        document.getElementById('cachePercent').textContent = (costBreakdown.cache_hit_rate * 100).toFixed(1) + '%';
        document.getElementById('costTotal').textContent = `$${costBreakdown.total_cost.toFixed(4)}`;
        document.getElementById('totalCost').textContent = `$${costBreakdown.total_cost.toFixed(4)}`;
    }

    updateDeploymentCheck(elementId, status) {
        const elem = document.getElementById(elementId);
        elem.className = `deployment-check ${status}`;
        elem.textContent = status === 'ready' ? '✓' : status === 'error' ? '✕' : '...';
    }

    deployGrids() {
        if (this.planner.plans.length === 0) {
            this.showToast('No plans to deploy. Run analysis first.', 'warning');
            return;
        }
        
        // Simulate deployment
        const totalOrders = this.planner.plans.reduce(
            (sum, p) => sum + p.orders.limit_orders.length,
            0
        );
        
        this.showToast(`🚀 Deploying ${totalOrders} orders across ${this.planner.plans.length} coins...`, 'success');
        
        // Update status
        this.updateDeploymentCheck('checkKuCoin', 'ready');
        this.updateDeploymentCheck('checkGCloud', 'ready');
        this.updateDeploymentCheck('checkPlans', 'ready');
        this.updateDeploymentCheck('checkCost', 'ready');
    }

    exportPlans() {
        if (this.planner.plans.length === 0) {
            this.showToast('No plans to export', 'warning');
            return;
        }
        
        const data = {
            metadata: {
                timestamp: new Date().toISOString(),
                model: this.config.selectedModel,
                exchange: this.config.exchange
            },
            plans: this.planner.plans,
            cost_summary: this.planner.costCalculator.getTotalCost()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grid-plans-${Date.now()}.json`;
        a.click();
        
        this.showToast('Plans exported successfully', 'success');
    }

    switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        event.target.classList.add('active');
        
        const tabMap = {
            'exchange': 'exchangeTab',
            'analysis': 'analysisTab',
            'constraints': 'constraintsTab',
            'llm': 'llmTab'
        };
        
        if (tabMap[tab]) {
            document.getElementById(tabMap[tab]).classList.add('active');
        }
    }

    switchPlansTab(tab) {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        if (event) event.target.classList.add('active');
        
        const tabMap = {
            'overview': 'overviewTab',
            'detailed': 'detailedTab',
            'orders': 'ordersTab'
        };
        
        if (tabMap[tab]) {
            document.getElementById(tabMap[tab]).classList.add('active');
        }
    }

    togglePanel(panelId) {
        const panel = document.getElementById(`${panelId}Panel`);
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.borderLeftColor = {
            'success': '#10b981',
            'error': '#ef4444',
            'warning': '#f59e0b',
            'info': '#0ea5e9'
        }[type] || '#0ea5e9';
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${{
                    'success': '✓',
                    'error': '✕',
                    'warning': '⚠',
                    'info': 'ⓘ'
                }[type] || '•'}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GridTradingApp();
});
