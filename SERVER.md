# Grid Trading Optimizer - Backend Server Setup

Optional Node.js backend for production deployment with real KuCoin and Google API integration.

## Installation

```bash
npm init -y
npm install express axios dotenv google-genai ccxt cors body-parser
npm install --save-dev nodemon
```

## Environment Variables (.env)

```env
# Google Cloud
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=global
GOOGLE_MODEL=gemini-2.0-flash
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# KuCoin
KUCOIN_API_KEY=your_api_key
KUCOIN_SECRET_KEY=your_secret_key
KUCOIN_PASSPHRASE=your_passphrase

# Server
PORT=3000
NODE_ENV=development

# Features
ENABLE_AUTO_DEPLOY=false
DRY_RUN_MODE=true
LOG_LEVEL=info
```

## server.js

```javascript
const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ccxt = require('ccxt');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));

// Initialize clients
const genai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genai.getGenerativeModel({ model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash' });

const initKuCoin = () => {
    return new ccxt.kucoin({
        apiKey: process.env.KUCOIN_API_KEY,
        secret: process.env.KUCOIN_SECRET_KEY,
        password: process.env.KUCOIN_PASSPHRASE,
        enableRateLimit: true,
    });
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fetch portfolio
app.get('/api/portfolio', async (req, res) => {
    try {
        const exchange = initKuCoin();
        const balance = await exchange.fetch_balance();
        
        // Filter non-zero balances
        const portfolio = {};
        for (const [currency, amounts] of Object.entries(balance)) {
            if (currency !== 'free' && currency !== 'used' && currency !== 'total' && 
                currency !== 'info' && amounts.total > 0) {
                portfolio[currency] = amounts;
            }
        }
        
        res.json({ success: true, portfolio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Analyze coin
app.post('/api/analyze', async (req, res) => {
    try {
        const { coin, config } = req.body;
        
        const exchange = initKuCoin();
        const symbol = `${coin}/USDT`;
        
        // Fetch OHLCV data
        const candles = await exchange.fetch_ohlcv(symbol, '1h', limit: 400);
        
        // Calculate indicators
        const indicators = calculateIndicators(candles);
        
        // Call Gemini for optimization
        const context = {
            coin,
            symbol,
            currentPrice: candles[candles.length - 1][4],
            indicators,
            config
        };
        
        const prompt = `You are a grid trading expert. Given this crypto analysis:\n\n${JSON.stringify(context, null, 2)}\n\nGenerate an optimized grid trading plan.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const gridPlan = JSON.parse(response.text());
        
        res.json({ success: true, gridPlan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Estimate costs
app.post('/api/estimate-costs', async (req, res) => {
    try {
        const { coins, config } = req.body;
        
        const costEstimate = {
            model: process.env.GOOGLE_MODEL,
            coins: coins.length,
            estimatedInputTokens: coins.length * 3000,
            estimatedOutputTokens: coins.length * 1000,
            costPerCoin: 0.000525,
            totalCost: coins.length * 0.000525,
            cacheUtilization: 0.75
        };
        
        res.json({ success: true, ...costEstimate });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Deploy grid plans
app.post('/api/deploy', async (req, res) => {
    try {
        const { plans } = req.body;
        const dryRun = process.env.DRY_RUN_MODE === 'true';
        
        if (dryRun) {
            res.json({ 
                success: true, 
                message: 'DRY RUN - No real orders placed',
                ordersCount: plans.reduce((sum, p) => sum + p.orders.limit_orders.length, 0)
            });
            return;
        }
        
        const exchange = initKuCoin();
        const deploymentResults = [];
        
        for (const plan of plans) {
            for (const order of plan.orders.limit_orders) {
                try {
                    const result = await exchange.create_limit_order(
                        plan.symbol,
                        order.side,
                        order.amount,
                        order.price
                    );
                    deploymentResults.push({ ...result, coin: plan.coin, status: 'success' });
                } catch (err) {
                    deploymentResults.push({ coin: plan.coin, error: err.message, status: 'failed' });
                }
            }
        }
        
        res.json({ success: true, deploymentResults });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get active orders
app.get('/api/orders/:coin', async (req, res) => {
    try {
        const exchange = initKuCoin();
        const symbol = `${req.params.coin}/USDT`;
        const orders = await exchange.fetch_open_orders(symbol);
        
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel orders
app.post('/api/cancel-orders', async (req, res) => {
    try {
        const { orderIds, coin } = req.body;
        const exchange = initKuCoin();
        const symbol = `${coin}/USDT`;
        
        const canceled = [];
        for (const orderId of orderIds) {
            try {
                const result = await exchange.cancel_order(orderId, symbol);
                canceled.push(result);
            } catch (err) {
                // Continue with next order
            }
        }
        
        res.json({ success: true, canceledCount: canceled.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper: Calculate indicators
function calculateIndicators(candles) {
    if (!candles || candles.length < 20) return {};
    
    const closes = candles.map(c => c[4]);
    const highs = candles.map(c => c[2]);
    const lows = candles.map(c => c[3]);
    const volumes = candles.map(c => c[5]);
    
    // ATR
    let trSum = 0;
    for (let i = 1; i <= 14; i++) {
        const idx = candles.length - i;
        const tr = Math.max(
            highs[idx] - lows[idx],
            Math.abs(highs[idx] - closes[idx - 1]),
            Math.abs(lows[idx] - closes[idx - 1])
        );
        trSum += tr;
    }
    const atr = trSum / 14;
    
    // Bollinger Bands
    const recent = closes.slice(-20);
    const mean = recent.reduce((a, b) => a + b) / 20;
    const stdDev = Math.sqrt(
        recent.reduce((a, b) => a + Math.pow(b - mean, 2)) / 20
    );
    
    return {
        atr,
        currentPrice: closes[closes.length - 1],
        bollingerUpper: mean + 2 * stdDev,
        bollingerMiddle: mean,
        bollingerLower: mean - 2 * stdDev,
        rsi: calculateRSI(closes),
        macd: calculateMACD(closes)
    };
}

function calculateRSI(closes, period = 14) {
    if (closes.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    // Simplified MACD calculation
    const fastEMA = calculateEMA(closes, fastPeriod);
    const slowEMA = calculateEMA(closes, slowPeriod);
    const macd = fastEMA - slowEMA;
    const signal = calculateEMA([macd], signalPeriod);
    
    return { macd, signal, histogram: macd - signal };
}

function calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
    }
    
    return ema;
}

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Grid Trading Optimizer running on port ${PORT}`);
    console.log(`📊 Model: ${process.env.GOOGLE_MODEL}`);
    console.log(`🔐 Dry Run: ${process.env.DRY_RUN_MODE}`);
});
```

## package.json

```json
{
  "name": "grid-trading-optimizer-server",
  "version": "1.0.0",
  "description": "Backend server for grid trading optimizer",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "@google/generative-ai": "^0.1.0",
    "ccxt": "^2.0.0",
    "cors": "^2.8.5",
    "body-parser": "^1.20.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Health Check
```bash
GET /api/health
```

### Fetch Portfolio
```bash
GET /api/portfolio

Response:
{
  "success": true,
  "portfolio": {
    "BTC": { "free": 0.5, "used": 0, "total": 0.5 },
    "ETH": { "free": 5, "used": 0, "total": 5 }
  }
}
```

### Analyze Coin
```bash
POST /api/analyze

Body:
{
  "coin": "BTC",
  "config": { ...config object... }
}

Response:
{
  "success": true,
  "gridPlan": { ...grid plan... }
}
```

### Estimate Costs
```bash
POST /api/estimate-costs

Body:
{
  "coins": ["BTC", "ETH", "XRP"],
  "config": { ...config object... }
}

Response:
{
  "success": true,
  "model": "gemini-2.0-flash",
  "coins": 3,
  "estimatedInputTokens": 9000,
  "estimatedOutputTokens": 3000,
  "costPerCoin": 0.000525,
  "totalCost": 0.001575,
  "cacheUtilization": 0.75
}
```

### Deploy Grid Plans
```bash
POST /api/deploy

Body:
{
  "plans": [ ...grid plans... ]
}

Response:
{
  "success": true,
  "message": "DRY RUN - No real orders placed",
  "ordersCount": 150
}
```

### Get Active Orders
```bash
GET /api/orders/:coin

Response:
{
  "success": true,
  "orders": [ ...open orders... ]
}
```

### Cancel Orders
```bash
POST /api/cancel-orders

Body:
{
  "orderIds": ["order1", "order2"],
  "coin": "BTC"
}

Response:
{
  "success": true,
  "canceledCount": 2
}
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
COPY credentials.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  optimizer:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - GOOGLE_PROJECT_ID=${GOOGLE_PROJECT_ID}
      - KUCOIN_API_KEY=${KUCOIN_API_KEY}
      - KUCOIN_SECRET_KEY=${KUCOIN_SECRET_KEY}
      - KUCOIN_PASSPHRASE=${KUCOIN_PASSPHRASE}
      - DRY_RUN_MODE=false
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## Production Deployment

1. **Set environment variables** in production
2. **Enable authentication** (add JWT or API key validation)
3. **Use HTTPS** only
4. **Enable rate limiting**
5. **Monitor logs** and metrics
6. **Set up backups** for configuration
7. **Use process manager** (PM2, systemd)
8. **Keep DRY_RUN_MODE=true** until thoroughly tested

## Performance Monitoring

Add monitoring to track:
- API call frequency
- Token usage
- Cost trends
- Order execution times
- Error rates

## Troubleshooting

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Connection refused"
- Verify KuCoin API credentials
- Check Google Cloud project setup
- Ensure firewall allows outbound connections

### "High latency"
- Use Gemini 2.0 Flash for faster responses
- Enable response caching
- Run server closer to API endpoints

---

For more information, see [README.md](README.md)
