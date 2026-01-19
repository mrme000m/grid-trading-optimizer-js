# 🤖 Grid Trading Optimizer Pro - JavaScript Edition

An advanced, AI-powered grid trading optimization system built with vanilla JavaScript. Real-time portfolio analysis, intelligent grid planning, continuous optimization loops, and transparent Google AI API cost tracking.

![Grid Trading Dashboard](https://user-gen-media-assets.s3.amazonaws.com/seedream_images/39b3e8b7-2d88-4dee-a4ca-c178e08bdc1f.png)

## ✨ Features

### Core Functionality
- **🔍 Multi-Timeframe Analysis**: Analyzes portfolio using 1D, 4H, 1H, 30M, and 5M candles
- **📊 Technical Indicators**:
  - ATR (Average True Range) for volatility assessment
  - Bollinger Bands for price bounds
  - Volume Profile with POC (Point of Control) and HVN (High Volume Nodes)
  - ADX for trend strength detection
  - EMA slope for trend direction
  - Consolidation detection

### AI Integration
- **🤖 Google Gemini AI Models**:
  - Gemini 2.0 Flash (fastest, recommended)
  - Gemini 1.5 Pro (advanced reasoning)
  - Gemini 1.5 Flash (cost-efficient)
- **💡 Smart Grid Generation**: AI-powered optimization using portfolio + market context
- **📈 Automatic Fallback**: Heuristic planner when AI disabled or unavailable

### Advanced Features
- **🔄 Continuous Optimization Loop**: Auto-recheck and optimize grids at configurable intervals
- **⚙️ Dynamic Grid Spacing**: Adaptive ATR-based or uniform grid levels
- **💰 Real-Time Cost Tracking**: 
  - Input/output token counting
  - Cache hit rate estimation
  - Per-model cost breakdown
  - Total API cost projection
- **🎯 Price-Based Invocation**: Trigger optimization on price movements
- **📱 Mobile-Responsive UI**: Works on desktop, tablet, and mobile
- **📥 JSON Config Upload**: Load custom configurations from files
- **📤 Export Plans**: Download grid plans as JSON

### Deployment & Safety
- **✅ Pre-Deployment Checks**: KuCoin, Google Cloud, plans validation
- **🔐 Dry-Run Mode**: Simulate deployments without placing real orders
- **📊 Order Preview**: Review all orders before deployment
- **🚀 Batch Deployment**: Deploy across multiple coins efficiently

## 🚀 Quick Start

### 1. Clone or Download
```bash
git clone https://github.com/yourusername/grid-trading-optimizer-js
cd grid-trading-optimizer-js
```

### 2. Open in Browser
```bash
# Simply open index.html in your browser
open index.html

# Or use a local server (recommended)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

### 3. Configure
- Click **"Configuration"** button
- Enter your KuCoin API credentials
- Set your Google Cloud Project ID
- Adjust analysis parameters as needed
- Click **"Save Configuration"**

### 4. Analyze
- Click **"Start Analysis"** to generate grid plans
- Review plans in the bottom panel
- Monitor cost estimation in real-time

### 5. Deploy (Optional)
- Click **"Deploy All Grids"** to execute plans
- Dry-run mode is enabled by default
- Review deployment checklist

## 📋 Configuration Guide

### Exchange & API Setup
```json
{
  "api": {
    "exchange": {
      "apiKey": "your_kucoin_api_key",
      "apiSecret": "your_kucoin_secret",
      "passphrase": "your_kucoin_passphrase"
    },
    "google": {
      "projectId": "your-google-project",
      "location": "global"
    }
  }
}
```

### Analysis Settings
```json
{
  "analysis": {
    "atr_period": 14,              // ATR calculation period
    "bb_period": 20,               // Bollinger Bands period
    "bb_stdev": 2.0,               // Bollinger Bands standard deviations
    "vpvr_bins": 60,               // Volume Profile bins
    "consolidation_max_range_pct": 3.0,  // Max consolidation range
    "timeframes": {
      "1d": {"limit": 120},        // Last 120 daily candles
      "4h": {"limit": 360},        // Last 360 4-hour candles
      "1h": {"limit": 400},        // Last 400 hourly candles
      "30m": {"limit": 400},
      "5m": {"limit": 600}
    }
  }
}
```

### Constraints
```json
{
  "constraints": {
    "min_grid_levels": 10,         // Minimum grid levels per coin
    "max_grid_levels": 25,         // Maximum grid levels per coin
    "min_spacing_percent": 0.25,   // Minimum spacing between levels
    "max_spacing_percent": 2.0,    // Maximum spacing between levels
    "per_coin_quote_budget_percent": 20,  // Budget per coin (% of total)
    "reserve_quote_percent": 30    // Reserve funds (% of total)
  }
}
```

### Per-Coin Overrides
```json
{
  "per_coin_constraints": {
    "BTC": {
      "max_grid_levels": 30,
      "per_coin_quote_budget_percent": 30
    },
    "ETH": {
      "max_grid_levels": 25
    }
  }
}
```

### Optimization Settings
```json
{
  "optimization": {
    "mode": "price_based",         // "time_based" or "price_based"
    "intervalSeconds": 300,        // Recheck interval (5 minutes)
    "priceChangeThreshold": 2.5,   // Trigger optimization on 2.5% change
    "maxIterations": 5,            // Max optimization cycles
    "enableAutoRebalance": true    // Auto-rebalance grids
  }
}
```

## 💰 Google AI Model Pricing

### Gemini 2.0 Flash (Recommended)
- **Input**: $0.075 per 1M tokens
- **Output**: $0.3 per 1M tokens
- **Cache Write**: $0.225 per 1M tokens (cached for 5 min)
- **Cache Read**: $0.0225 per 1M tokens (90% discount)
- **Context Window**: 1M tokens
- **Latency**: 2-3 seconds

### Gemini 1.5 Pro
- **Input**: $3.5 per 1M tokens
- **Output**: $10.5 per 1M tokens
- **Cache Write**: $10.5 per 1M tokens
- **Cache Read**: $0.525 per 1M tokens
- **Context Window**: 2M tokens
- **Latency**: 5-8 seconds

### Gemini 1.5 Flash
- **Input**: $0.375 per 1M tokens
- **Output**: $1.5 per 1M tokens
- **Cache Write**: $1.5 per 1M tokens
- **Cache Read**: $0.0375 per 1M tokens
- **Context Window**: 1M tokens
- **Latency**: 3-4 seconds

### Cost Estimation Example
**Analyzing 10 coins with Gemini 2.0 Flash:**
- Input tokens per call: ~3,000 tokens = $0.000225
- Output tokens per call: ~1,000 tokens = $0.0003
- Cost per coin: ~$0.000525
- Total for 10 coins: ~$0.00525
- With 5 optimization iterations: ~$0.02625 (**~$0.03/day**)

## 📊 Dashboard Components

### Left Panel: Analysis Metrics
- **Coins Analyzed**: Total coins processed
- **Total Grids**: Sum of all grid levels
- **API Calls**: Number of API requests
- **Estimated Cost**: Total API cost in USD
- **Model Selector**: Choose AI model
- **Cost Breakdown**: Token usage and costs

### Right Panel: Optimization Engine
- **Loop Status**: Current optimization state
- **Interval & Iterations**: Control automatic loops
- **Progress Bar**: Visualization of loop progress
- **Deployment Checklist**: Pre-deployment validation
- **Deploy Button**: Execute all plans
- **Export Button**: Download plans as JSON

### Bottom Panel: Grid Plans
- **Overview Tab**: Summary of all plans
- **Detailed Tab**: Full analysis metrics per coin
- **Orders Tab**: Complete order list for deployment

## 🔧 Technical Architecture

### Core Classes

#### TechnicalIndicators
- `calculateATR()`: Average True Range
- `calculateBollingerBands()`: Bollinger Bands
- `calculateVolumeProfile()`: Volume Profile with POC
- `calculateADX()`: ADX and Directional Indicators

#### CostCalculator
- `estimatePromptTokens()`: Input token estimation
- `estimateOutputTokens()`: Output token estimation
- `calculateCost()`: Cost breakdown
- `getTotalCost()`: Aggregate costs

#### GridPlanner
- `generatePlanForCoin()`: Generate grid for single coin
- `generateLevels()`: Create grid levels
- `generateOrders()`: Generate buy/sell orders
- `estimateCapital()`: Calculate required capital

#### GridTradingApp
- `startOptimization()`: Single optimization run
- `startOptimizationLoop()`: Continuous loop
- `renderPlans()`: Visualize grid plans
- `deployGrids()`: Execute plans
- `exportPlans()`: Export to JSON

## 🎮 Usage Workflows

### Workflow 1: Quick Analysis
```
1. Open index.html in browser
2. Click "Load Template"
3. Click "Start Analysis"
4. Review generated plans
5. Click "Export JSON Plans"
```

### Workflow 2: Custom Configuration
```
1. Edit config.example.json with your settings
2. Save as config.json
3. Click "Configuration"
4. Upload config.json
5. Review and adjust parameters
6. Click "Start Analysis"
```

### Workflow 3: Continuous Optimization
```
1. Configure settings
2. Click "Start Loop"
3. Set interval (default: 30 seconds)
4. Set max iterations (default: 5)
5. Monitor progress bar
6. Stop when complete or manually stop
```

### Workflow 4: Cost Optimization
```
1. Compare models in Cost Breakdown section
2. Switch to Gemini 2.0 Flash (cheapest with best performance)
3. Enable cache to reduce costs (90% discount on cached tokens)
4. Monitor token usage
5. Adjust parameters if cost too high
```

## 🔐 Security Considerations

### API Keys
- **Never commit API keys** to version control
- Use environment variables or `.env` files
- Rotate keys regularly
- Use IP whitelisting on exchange API

### Dry-Run Mode
- **Always enabled by default**
- Disable only after thorough testing
- Review all orders before deployment
- Start with small budget allocation

### Rate Limiting
- Google API: 1 request per second
- KuCoin API: Check exchange limits
- Configurable in `deployment.rateLimit`

## 📈 Performance Tips

1. **Use Gemini 2.0 Flash** for real-time analysis (~$0.03/day)
2. **Enable cache** to reduce costs (90% discount)
3. **Optimize timeframes** - use fewer candles if possible
4. **Batch analysis** - process multiple coins per request
5. **Monitor token usage** - adjust parameters if exceeding budget

## 🐛 Troubleshooting

### "No plans generated"
- Check API credentials
- Verify exchange has active pairs
- Check portfolio has balances
- Enable LLM or heuristic planner

### "High API costs"
- Switch to cheaper model (Gemini 2.0 Flash)
- Reduce timeframe candle limits
- Enable caching
- Increase optimization interval

### "Plans not deploying"
- Verify exchange connection
- Check API permissions (spot trading)
- Enable dry-run first
- Review deployment checklist

## 📦 File Structure

```
grid-trading-optimizer-js/
├── index.html              # Main HTML UI
├── app.js                  # Application logic (28KB)
├── config.example.json     # Configuration template
├── README.md              # This file
└── plans/                 # Generated grid plans (created on export)
```

## 🚀 Deployment Options

### Option 1: Local Development
```bash
python3 -m http.server 8000
open http://localhost:8000
```

### Option 2: Static Hosting (Vercel, Netlify)
```bash
# Simply upload index.html and app.js
# Add config.example.json for template
```

### Option 3: Docker
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
EXPOSE 80
```

### Option 4: Electron Desktop App
```bash
npm install electron
npx electron .
```

## 🔄 Optimization Loop Mechanics

### Time-Based Mode
- Runs every N seconds (default: 30)
- Completes M iterations (default: 5)
- Best for stable conditions

### Price-Based Mode
- Triggers on price change > N% (default: 2.5%)
- Recalculates grids immediately
- Better for volatile markets

### Auto-Rebalance
- Detects grid imbalances
- Adjusts levels based on new price
- Maintains trading intensity

## 📊 API Response Caching

**Google AI Cache Benefits:**
- **90% discount** on cached tokens
- **5-minute cache window** per request
- **Automatic detection** of repeated context
- **Token counting** in cost breakdown

**Example:**
- First call: 3,000 input tokens @ $0.075/1M = $0.000225
- Cached calls: 3,000 tokens @ $0.0225/1M = $0.0000675 (90% savings)
- **5 cached calls save: $0.0007575** vs $0.001125

## 🎓 Learning Resources

- [Grid Trading Basics](https://en.wikipedia.org/wiki/Grid_trading)
- [Technical Analysis Guide](https://www.investopedia.com/)
- [Google Gemini API Docs](https://ai.google.dev/)
- [KuCoin API Reference](https://docs.kucoin.com/)
- [Volume Profile Trading](https://en.wikipedia.org/wiki/Market_profile)

## 📝 License

MIT License - Feel free to use, modify, and distribute.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## ⚠️ Disclaimer

**This tool is for educational and research purposes only.**

- Always test with dry-run mode first
- Past performance ≠ future results
- Crypto trading carries significant risk
- Use only capital you can afford to lose
- Consult a financial advisor
- Not financial advice

## 📞 Support

- GitHub Issues: Report bugs or request features
- Discussions: Ask questions or share strategies
- Email: support@example.com

## 🙏 Acknowledgments

Built with:
- Vanilla JavaScript (no dependencies)
- Google Gemini AI API
- KuCoin Exchange API
- Modern web standards

---

**Last Updated**: January 19, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
