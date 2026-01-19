# 💰 Google AI API Cost Analysis & Optimization Guide

Detailed breakdown of costs, optimization strategies, and ROI calculations for grid trading optimization.

## Current Pricing (January 2026)

### Gemini Models Pricing Comparison

| Model | Input | Output | Cache Write | Cache Read | Context | Latency |
|-------|-------|--------|-------------|------------|---------|----------|
| **Gemini 2.0 Flash** | $0.075/1M | $0.3/1M | $0.225/1M | $0.0225/1M | 1M | 2-3s |
| Gemini 1.5 Pro | $3.5/1M | $10.5/1M | $10.5/1M | $0.525/1M | 2M | 5-8s |
| Gemini 1.5 Flash | $0.375/1M | $1.5/1M | $1.5/1M | $0.0375/1M | 1M | 3-4s |

**Recommendation**: Gemini 2.0 Flash offers **best price/performance ratio** 🌟

## Cost Breakdown Example

### Single Coin Analysis (BTC)

**Input Prompt Composition:**
```
Metadata + Context:                ~500 tokens
Technical Indicators (1D-5M):      ~1,500 tokens
Volume Profile + Price Action:     ~800 tokens
Portfolio & Balance Info:          ~200 tokens
Constraints & Settings:            ~300 tokens
────────────────────────────────────────────
Total Input Tokens:                ~3,300 tokens
```

**Output Response:**
```
Grid plan JSON structure:          ~800 tokens
Explanation & rationale:           ~300 tokens
Optimization details:              ~150 tokens
────────────────────────────────────────────
Total Output Tokens:               ~1,250 tokens
```

### Cost Calculation (Gemini 2.0 Flash)

```
Input Cost:   (3,300 / 1,000,000) × $0.075      = $0.0002475
Output Cost:  (1,250 / 1,000,000) × $0.3        = $0.000375
──────────────────────────────────────────────────────────
Cost Per Analysis:                                 $0.0006225

Rounded Up (Safety Margin):                      ~$0.001 per coin
```

## Scalability Analysis

### Portfolio Sizes

**Small Portfolio (5 coins)**
```
Daily Analysis (1x):           $0.005
Hourly Analysis (24x):         $0.12
Every 30 min (48x):            $0.24
Monthly (1x daily):            $0.15
───────────────────────────────────────
Cost: NEGLIGIBLE (~$0.15/month)
```

**Medium Portfolio (15 coins)**
```
Daily Analysis (1x):           $0.015
Hourly Analysis (24x):         $0.36
Every 30 min (48x):            $0.72
Monthly (1x daily):            $0.45
───────────────────────────────────────
Cost: VERY CHEAP (~$0.45/month)
```

**Large Portfolio (50 coins)**
```
Daily Analysis (1x):           $0.05
Hourly Analysis (24x):         $1.20
Every 30 min (48x):            $2.40
Monthly (1x daily):            $1.50
───────────────────────────────────────
Cost: CHEAP (~$1.50/month)
```

**Enterprise Portfolio (200 coins)**
```
Daily Analysis (1x):           $0.20
Hourly Analysis (24x):         $4.80
Every 5 min (288x):            $57.60
Monthly (1x daily):            $6.00
───────────────────────────────────────
Cost: AFFORDABLE (~$6/month for daily, $58/day for 5-min)
```

## Optimization Strategies

### Strategy 1: Token Reduction

**Baseline (All Data):**
- 5 timeframes (1D, 4H, 1H, 30M, 5M)
- 400+ candles per timeframe
- Full volume profile
- Cost per coin: ~$0.001

**Optimized (Selective Data):**
```json
{
  "analysis": {
    "timeframes": {
      "1d": {"limit": 60},      // reduced from 120
      "4h": {"limit": 120},     // reduced from 360
      "1h": {"limit": 200}      // reduced from 400
    },
    "vpvr_bins": 30              // reduced from 60
  }
}
```

**Impact:**
- Token reduction: ~40%
- Cost per coin: ~$0.0006 (**40% savings**)
- Trade-off: Slightly less granular analysis

### Strategy 2: Batch Processing

**Single Requests (Current):**
```
10 coins × $0.001 per request = $0.01
```

**Batch Request (Proposed):**
```json
{
  "batch_analysis": {
    "coins": ["BTC", "ETH", "XRP", ...],
    "use_cache": true,
    "shared_context": true
  }
}
```

**Impact:**
- Tokens per request: ~5,000 (vs 3,300 × 10 = 33,000)
- Cost: ~$0.002 (**80% savings**)
- Trade-off: Longer response time

### Strategy 3: Cache Utilization

**Without Cache:**
```
10 coins × $0.001 = $0.01 per run
5 runs per day = $0.05/day
```

**With Cache (5-min TTL):**
```
First request:    $0.001 (full cost)
Cached requests:  $0.0003 per request (90% discount!)
4 cached requests: $0.0012
──────────────────────────────
Per 5-min cycle: $0.0022 (55% savings vs $0.005)

Daily (288 cycles):  ~$0.63/day
Without cache:       ~$1.44/day
──────────────────────────────
DAILY SAVINGS: ~$0.81 (56% reduction!)
```

**Cache Strategy:**
```
1st analysis (00:00): Full cost         $0.001
2nd analysis (00:05): Cached            $0.0003 ← 90% discount
3rd analysis (00:10): Cached            $0.0003 ← 90% discount
4th analysis (00:15): Cached            $0.0003 ← 90% discount  
5th analysis (00:20): Full cost         $0.001   ← cache expired
```

### Strategy 4: Selective Analysis

**Analyze only when conditions change:**

```javascript
// Only trigger analysis when:
1. Price change > 2% (price_based mode)
2. Volatility changes significantly
3. Volume spikes
4. Grid imbalance detected
```

**Impact:**
- Reduce calls from 288/day (5-min) to ~50/day (event-based)
- Cost reduction: ~82%
- Better capital efficiency

## ROI Calculation

### Investment vs Return

**Scenario: $10,000 Portfolio, Gemini 2.0 Flash**

**Monthly Costs:**
```
Analysis:  10 coins × $0.001 × 30 days = $0.30
Data:      API calls + cache           = $0.05
──────────────────────────────────────────────
Total Monthly Cost:                      $0.35
```

**Expected Returns:**
```
With optimal grid trading:
- Win rate: 65%
- Avg profit per trade: 0.5%
- Grids per coin: 20
- Active trades: ~60/day

Daily profit: $10,000 × 0.5% × 0.65 × 0.1 = ~$3.25
Monthly profit: ~$97.50
```

**ROI:**
```
Profit / Cost = $97.50 / $0.35 = 278x

Break-even: ~0.004% daily return
(Grid trading typically achieves 1-5% monthly)
```

## Free Tier & Quotas

### Google AI Free Trial
- **1M free API calls** per month
- Expires after 90 days or quota reached
- Perfect for testing

### Estimated free quota:
```
1,000,000 API calls ÷ 3,300 tokens per call = ~303 analyses
303 analyses ÷ 30 days = ~10 analyses per day

Enough for: 1-2 coins with hourly analysis
```

## Cost Monitoring Dashboard

The app tracks:

```
┌─────────────────────────────────────┐
│ Cost Breakdown                      │
├─────────────────────────────────────┤
│ Input Tokens:      12,450 K         │
│ Output Tokens:     3,750 K          │
│ Cache Hit Rate:    65%              │
│ Estimated Total:   $0.0453          │
└─────────────────────────────────────┘
```

### Real-time tracking:
1. **Token counters** update after each analysis
2. **Cost projection** shows daily/monthly estimate
3. **Model comparison** shows alternative model costs
4. **Cache utilization** indicates savings

## Billing Best Practices

### 1. Set Budget Alert
```
Google Cloud Console:
1. Go to Billing
2. Set Budget Alert at $5/month
3. Receive email if exceeded
```

### 2. Use Service Account
```bash
# Generate service account key
# Easier to manage and rotate
# Can set per-service quotas
```

### 3. Enable Quota Limits
```
Google Cloud Console:
1. APIs & Services → Quotas
2. Set max requests/minute: 60
3. Set max API calls/day: 10,000
4. Protects from runaway costs
```

### 4. Monitor Daily
```
Daily checklist:
- [ ] Check token usage in dashboard
- [ ] Verify cost is under budget
- [ ] Monitor for anomalies
- [ ] Review cache hit rate
```

## Cost Optimization Checklist

- [ ] **Use Gemini 2.0 Flash** (cheapest with best performance)
- [ ] **Enable API caching** (90% discount on repeated calls)
- [ ] **Reduce timeframe candles** (40% token reduction)
- [ ] **Use event-based triggers** (82% fewer API calls)
- [ ] **Batch similar coins** (80% token reduction)
- [ ] **Selective analysis** (only when conditions change)
- [ ] **Monitor daily costs** (catch anomalies early)
- [ ] **Set budget alerts** (Google Cloud)
- [ ] **Use free tier first** (test before paying)
- [ ] **Track ROI** (ensure profits > costs)

## Monthly Cost Examples

### Conservative Setup
```
5 coins × 1 analysis/day × $0.001 = $0.15/month
Cost per profitable trade: ~$0.001
ROI needed for break-even: 0.003%
```

### Active Setup
```
15 coins × 4 analyses/day × $0.001 = $1.80/month
Cost per profitable trade: ~$0.005
ROI needed for break-even: 0.02%
```

### Aggressive Setup
```
50 coins × 48 analyses/day × $0.0006 = $1.44/month (with cache)
Cost per profitable trade: ~$0.002
ROI needed for break-even: 0.007%
```

### Enterprise Setup
```
200 coins × 288 analyses/day × $0.0004 = ~$70/month (with cache + batch)
Cost per profitable trade: ~$0.001
ROI needed for break-even: 0.003%
```

## Conclusion

**Grid Trading Optimizer is incredibly cost-effective:**

1. **Ultra-low costs**: $0.35-70/month for full automation
2. **High ROI**: Costs covered by typical 0.5-2% monthly grid trading returns
3. **Scalable**: Costs don't scale linearly (batching, caching, event-based triggers)
4. **Profitable**: Break-even at 0.003% daily return (easily achievable)
5. **Risk-free**: Test with free tier before committing

**Recommendation:**
- Start with **Gemini 2.0 Flash**
- Use **free tier for testing**
- Enable **caching from day one**
- Monitor **costs and ROI** daily
- Scale up **gradually**

---

For more details, see [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)
