# 🚀 Grid Trading Optimizer - Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Open the Application (30 seconds)

**Option A: Direct Browser (Easiest)**
```bash
# Download index.html and app.js
# Open index.html directly in your browser
# That's it! 🎎
```

**Option B: Local Server (Recommended)**
```bash
# Python 3
python3 -m http.server 8000

# Then open: http://localhost:8000
```

**Option C: Live Server (VS Code)**
```
Right-click index.html → Open with Live Server
```

## Step 2: Configure API Keys (2 minutes)

### Get KuCoin API Keys
1. Log in to KuCoin
2. Settings → API Management
3. Create new API key
4. Copy: **API Key, Secret Key, Passphrase**
5. Enable **Spot Trading** permission

### Get Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project (or use existing)
3. Enable **Generative AI API**
4. Create service account
5. Download JSON credentials
6. Copy **Project ID**

### Enter in Dashboard
1. Click **"Configuration"** button
2. Click **"Exchange & API"** tab
3. Paste credentials:
   - KuCoin API Key
   - KuCoin API Secret
   - KuCoin Passphrase
   - Google Cloud Project ID
4. Click **"Save Configuration"**

## Step 3: Run Analysis (1 minute)

1. Click **"Start Analysis"** button
2. Wait for coins to analyze (~30 seconds)
3. Review generated plans
4. Check cost estimation

## Step 4: View Results (1 minute)

### Overview Tab
- See all coin plans
- Current price and grid levels
- Expected capital requirement

### Models Tab
- Compare AI models
- View pricing for each
- Switch between models

### Cost Breakdown
- Input tokens used
- Output tokens generated
- Cache hit rate
- **Total estimated cost**

## Step 5 (Optional): Continuous Loop

```
1. Set optimization interval (default: 30 seconds)
2. Set max iterations (default: 5)
3. Click "Start Loop"
4. Watch progress bar
5. Monitor cost accumulation
```

## Step 6 (Optional): Deploy

```
1. Review deployment checklist
2. Click "Deploy All Grids"
   - Dry-run mode by default (no real orders)
   - Review order list
   - Verify amounts and prices
3. Enable in production when confident
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Open Configuration |
| `A` | Start Analysis |
| `L` | Start Loop |
| `S` | Stop Loop |
| `D` | Deploy |
| `E` | Export Plans |

## Common Actions

### Load Default Template
```
Click: "Load Template" button
Result: Pre-filled optimal settings for most use cases
```

### Change AI Model
```
1. Scroll to "Google AI Models" section
2. Click model card
3. Shows: Name, latency, context, and pricing
Tip: Gemini 2.0 Flash is cheapest (~$0.03/day for 10 coins)
```

### Export Plans as JSON
```
1. Run analysis
2. Click "Export JSON Plans"
3. File downloads: grid-plans-{timestamp}.json
Use: Import into trading bot or review later
```

### Check Cost Before Deploying
```
1. Review "Cost Breakdown" panel
2. Calculate: (Coins × Cost Per Coin)
3. Multiply by optimization loops
4. Total daily cost ≈ cost × (86400 / interval)
```

## Cost Examples

### Scenario 1: Quick Analysis (10 coins, 1 run)
- Model: Gemini 2.0 Flash
- Input: ~30,000 tokens
- Output: ~10,000 tokens
- **Cost: ~$0.005** (~$0.01 with margin)

### Scenario 2: Hourly Optimization (10 coins, 24 runs/day)
- Per run: ~$0.005
- Daily: ~$0.12
- Monthly: ~$3.60
- **Very cheap!**

### Scenario 3: Every 5 minutes (10 coins, 288 runs/day)
- Per run: ~$0.005
- Daily: ~$1.44
- Monthly: ~$43.20
- **Still affordable for active traders**

## Troubleshooting

### "No coins showing"
- Check KuCoin API key/secret
- Verify API key has **spot trading** enabled
- Ensure you have balances in portfolio

### "High cost estimates"
- Switch to **Gemini 2.0 Flash** (cheaper)
- Reduce number of coins analyzed
- Use fewer timeframes
- Increase optimization interval

### "Deployment checking fails"
- Verify API credentials again
- Check internet connection
- For dry-run, this is expected

### "Cannot export plans"
- Run analysis first
- Check browser console for errors
- Try refreshing page

## Next Steps

1. **Read Full Documentation**: See [README.md](README.md)
2. **Setup Backend Server**: See [SERVER.md](SERVER.md) for production
3. **Configure Advanced Settings**: Edit [config.example.json](config.example.json)
4. **Monitor Costs**: Track token usage in Cost Breakdown panel
5. **Start Small**: Use dry-run mode, test with small amounts

## Advanced: Upload Custom Config

```json
// Save as config.json
{
  "constraints": {
    "min_grid_levels": 8,
    "max_grid_levels": 20,
    "per_coin_quote_budget_percent": 15
  },
  "analysis": {
    "atr_period": 20,
    "bb_period": 25
  }
}
```

Then:
1. Click **"Configuration"**
2. Click the dashed upload area
3. Select config.json
4. Settings auto-populate
5. Click **"Save Configuration"**

## Pro Tips

✅ **Enable cache** to get 90% discount on repeated analyses
✅ **Use Gemini 2.0 Flash** - best performance/cost ratio
✅ **Monitor token usage** - crucial for cost tracking
✅ **Start with dry-run** - test before real deployment
✅ **Export plans regularly** - backup your strategies
✅ **Track optimization iterations** - watch for diminishing returns
✅ **Adjust intervals** - balance precision vs. cost
✅ **Review orders daily** - catch any issues early

## Mobile Usage

Works on mobile but:
- Configuration is easier on desktop
- Use landscape mode for charts
- Small buttons - use stylus/pen for precision
- Consider hosting on server for better mobile experience

## Getting Help

**Bug Reports**: Open GitHub issue with:
- Browser and version
- Steps to reproduce
- Screenshot or error message
- Configuration you're using

**Questions**: Check:
- [README.md](README.md) - full documentation
- [config.example.json](config.example.json) - all options
- Console log - press F12 and check for errors

## What's Next?

Once comfortable:
1. Set up **backend server** (see [SERVER.md](SERVER.md))
2. Connect to **real KuCoin** account
3. **Enable live deployment** (disable dry-run)
4. Set up **continuous monitoring**
5. Integrate with **trading signals**

---

**Created**: January 19, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

[Back to Main README →](README.md)
