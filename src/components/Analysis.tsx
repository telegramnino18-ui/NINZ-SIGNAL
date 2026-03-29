import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, TrendingDown, Info, RefreshCw, AlertTriangle, BarChart2, Clock, Terminal as TerminalIcon, Activity, Globe, Zap, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { auth } from '../firebase';
import ReactMarkdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

interface EconomicEvent {
  time: string;
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currency: string;
}

interface MarketData {
  analysis: string;
  sentiment: {
    xau: { label: string; value: number; change: string };
    btc: { label: string; value: number; change: string };
  };
  levels: {
    xau: { resistance: string; support: string; pivot: string; entry: string; sl: string; tp: string };
    btc: { resistance: string; support: string; pivot: string; entry: string; sl: string; tp: string };
  };
  swingLevels: {
    xau: { entry: string; sl: string; tp: string };
    btc: { entry: string; sl: string; tp: string };
  };
  indicators: {
    rsi: string;
    volatility: string;
    volume24h: string;
  };
  economicCalendar: EconomicEvent[];
}

type Timeframe = '1M' | '5M' | '1H' | '4H' | '1D';
type Pair = 'XAU/USD' | 'BTC/USD';

interface TapeEntry {
  id: string;
  time: string;
  price: number;
  size: string;
  side: 'BUY' | 'SELL';
}

export const Analysis = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<Pair>('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('5M');
  const [tape, setTape] = useState<TapeEntry[]>([]);
  
  // Trading Panel State
  const [orderType, setOrderType] = useState<'SCALP' | 'SWING'>('SCALP');
  const [lotSize, setLotSize] = useState('0.10');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [useCustomScalp, setUseCustomScalp] = useState(false);
  const [swingStopLoss, setSwingStopLoss] = useState('');
  const [swingTakeProfit, setSwingTakeProfit] = useState('');
  const [useCustomSwing, setUseCustomSwing] = useState(false);
  const [isOneClick, setIsOneClick] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState<{ connected: boolean; message?: string; accountInfo?: any }>({ connected: false });
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Live Price State
  const [livePrices, setLivePrices] = useState({
    'XAU/USD': { price: 2150.45, change: '+0.12%', isUp: true },
    'BTC/USD': { price: 65432.10, change: '+1.45%', isUp: true }
  });

  // Tape Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const side = Math.random() > 0.45 ? 'BUY' : 'SELL';
      const size = (Math.random() * 2 + 0.1).toFixed(2);
      const newEntry: TapeEntry = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: livePrices[selectedPair].price + (Math.random() - 0.5) * 0.05,
        size: selectedPair === 'BTC/USD' ? size : (parseFloat(size) * 10).toFixed(1),
        side
      };
      setTape(prev => [newEntry, ...prev].slice(0, 15));
    }, 800);
    return () => clearInterval(interval);
  }, [selectedPair, livePrices]);

  // WebSocket for BTC/USD (Binance)
  useEffect(() => {
    const btcWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');
    
    btcWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.c);
      const change = parseFloat(data.P);
      setLivePrices(prev => ({
        ...prev,
        'BTC/USD': {
          price: price,
          change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
          isUp: change >= 0
        }
      }));
    };

    // Simulated XAU/USD Feed
    const xauInterval = setInterval(() => {
      setLivePrices(prev => {
        const current = prev['XAU/USD'];
        const move = (Math.random() - 0.5) * 0.08;
        const newPrice = current.price + move;
        return {
          ...prev,
          'XAU/USD': {
            ...current,
            price: newPrice
          }
        };
      });
    }, 1000);

    return () => {
      btcWs.close();
      clearInterval(xauInterval);
    };
  }, []);

  // Generate mock historical data
  const generateChartData = (pair: Pair, timeframe: Timeframe) => {
    const points = timeframe === '1M' ? 60 : timeframe === '5M' ? 50 : timeframe === '1H' ? 24 : 30;
    const basePrice = pair === 'XAU/USD' ? 2150 : 65000;
    const volatility = pair === 'XAU/USD' ? 8 : 1200;
    
    return Array.from({ length: points }).map((_, i) => {
      const time = new Date();
      if (timeframe === '1M') time.setMinutes(time.getMinutes() - (points - i));
      if (timeframe === '5M') time.setMinutes(time.getMinutes() - (points - i) * 5);
      if (timeframe === '1H') time.setHours(time.getHours() - (points - i));
      if (timeframe === '4H') time.setHours(time.getHours() - (points - i) * 4);
      if (timeframe === '1D') time.setDate(time.getDate() - (points - i));

      const price = basePrice + (Math.random() - 0.5) * (volatility / (timeframe === '1M' ? 10 : timeframe === '5M' ? 5 : 1)) + (i * (volatility / 20));
      return {
        time: timeframe === '1D' ? time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 
              time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        price,
        ema8: price * 0.999, // Mock EMA
        ema21: price * 0.998 // Mock EMA
      };
    });
  };

  const chartData = useMemo(() => {
    const data = generateChartData(selectedPair, selectedTimeframe);
    if (data.length > 0) {
      data[data.length - 1].price = livePrices[selectedPair].price;
    }
    return data;
  }, [selectedPair, selectedTimeframe, livePrices[selectedPair].price]);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = (process.env as any).GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key is missing');
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Lakukan analisis SCALPING (M1/M5) dan MINI SWING (durasi 20 menit - 2 jam) untuk ${selectedPair}. Gunakan Google Search untuk mendapatkan data harga terkini, rilis data ekonomi, dan struktur pasar. Berikan sinyal masuk/keluar cepat untuk scalp dan sinyal swing valid untuk durasi 2h.`,
        config: {
          systemInstruction: `Anda adalah Scalper & Swing Trader Bloomberg Terminal profesional. Berikan data dalam format JSON murni. 
          PENTING: Jangan gunakan markdown code blocks. Berikan hanya string JSON mentah.
          Struktur: { 
            "analysis": "teks markdown strategi scalping & swing", 
            "sentiment": { 
              "xau": { "label": "BULLISH/BEARISH", "value": 0-100, "change": "+0.00%" }, 
              "btc": { "label": "BULLISH/BEARISH", "value": 0-100, "change": "+0.00%" } 
            }, 
            "levels": { 
              "xau": { "resistance": "harga", "support": "harga", "pivot": "harga", "entry": "harga", "sl": "harga", "tp": "harga" }, 
              "btc": { "resistance": "harga", "support": "harga", "pivot": "harga", "entry": "harga", "sl": "harga", "tp": "harga" } 
            },
            "swingLevels": {
              "xau": { "entry": "harga", "sl": "harga", "tp": "harga" },
              "btc": { "entry": "harga", "sl": "harga", "tp": "harga" }
            },
            "indicators": {
              "rsi": "nilai",
              "volatility": "tingkat",
              "volume24h": "jumlah"
            },
            "economicCalendar": [
              { "time": "HH:mm", "event": "nama event", "impact": "HIGH/MEDIUM/LOW", "currency": "USD/BTC" }
            ]
          }`,
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text;
      if (!text) throw new Error('No response from AI');
      
      const result = JSON.parse(text);
      setData(result);
    } catch (err: any) {
      console.error('Analysis error details:', err);
      setError('Gagal memuat data Terminal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAnalysis();
    checkBrokerStatus();
  }, []);

  const checkBrokerStatus = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch('/api/broker/status', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      setBrokerStatus(data);
    } catch (err) {
      console.error('Failed to check broker status:', err);
    }
  };

  // Sync trading inputs with AI levels
  useEffect(() => {
    if (data) {
      const levels = selectedPair === 'XAU/USD' ? 
        (orderType === 'SCALP' ? data.levels.xau : data.swingLevels.xau) : 
        (orderType === 'SCALP' ? data.levels.btc : data.swingLevels.btc);
      setEntryPrice(levels.entry);
      
      if (orderType === 'SCALP' && !useCustomScalp) {
        setStopLoss(levels.sl);
        setTakeProfit(levels.tp);
      } else if (orderType === 'SWING' && !useCustomSwing) {
        setSwingStopLoss(levels.sl);
        setSwingTakeProfit(levels.tp);
      }
    }
  }, [data, selectedPair, orderType, useCustomSwing, useCustomScalp]);

  const validateLevels = (side: 'BUY' | 'SELL', sl: string, tp: string, entry: string, lot: string) => {
    const slNum = parseFloat(sl);
    const tpNum = parseFloat(tp);
    const entryNum = parseFloat(entry);
    const lotNum = parseFloat(lot);
    
    if (isNaN(lotNum) || lotNum <= 0) return "Lot size must be a positive number";
    if (isNaN(entryNum) || entryNum <= 0) return "Entry price must be a valid positive number";
    if (isNaN(slNum) || isNaN(tpNum)) return "SL/TP must be valid numbers";
    if (slNum <= 0 || tpNum <= 0) return "SL/TP must be positive values";
    
    if (side === 'BUY') {
      if (slNum >= entryNum) return "For BUY, Stop Loss must be below Entry Price";
      if (tpNum <= entryNum) return "For BUY, Take Profit must be above Entry Price";
    } else {
      if (slNum <= entryNum) return "For SELL, Stop Loss must be above Entry Price";
      if (tpNum >= entryNum) return "For SELL, Take Profit must be below Entry Price";
    }
    return null;
  };

  const handlePlaceOrder = async (side: 'BUY' | 'SELL') => {
    const currentSL = orderType === 'SWING' ? swingStopLoss : stopLoss;
    const currentTP = orderType === 'SWING' ? swingTakeProfit : takeProfit;

    const validationError = validateLevels(side, currentSL, currentTP, entryPrice, lotSize);
    if (validationError) {
      toast.error(validationError, {
        style: { background: '#0A0A0A', color: '#fff', border: '1px solid rgba(239,68,68,0.1)', fontFamily: 'monospace' }
      });
      return;
    }

    if (!brokerStatus.connected) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs uppercase tracking-widest">Broker Disconnected</span>
          <span className="text-[10px] opacity-70">Please configure MetaTrader credentials in your Profile.</span>
        </div>,
        {
          style: {
            background: '#0A0A0A',
            color: '#fff',
            border: '1px solid rgba(239,68,68,0.1)',
            fontFamily: 'monospace'
          }
        }
      );
      return;
    }

    setIsExecuting(true);
    const loadingToast = toast.loading('Executing order on MetaTrader...', {
      style: {
        background: '#0A0A0A',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'monospace'
      }
    });

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/trade/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          symbol: selectedPair,
          side,
          volume: lotSize,
          stopLoss: orderType === 'SWING' ? swingStopLoss : stopLoss,
          takeProfit: orderType === 'SWING' ? swingTakeProfit : takeProfit
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-xs uppercase tracking-widest">Order Executed</span>
            <span className="text-[10px] opacity-70">Order ID: #{result.orderId}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${side === 'BUY' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                {side} {lotSize} {selectedPair}
              </span>
              <span className="text-[10px] font-mono">@ {livePrices[selectedPair].price.toFixed(2)}</span>
            </div>
          </div>,
          {
            id: loadingToast,
            duration: 5000,
            style: {
              background: '#0A0A0A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'monospace'
            }
          }
        );
      } else {
        throw new Error(result.error || 'Failed to execute order');
      }
    } catch (error: any) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs uppercase tracking-widest">Execution Failed</span>
          <span className="text-[10px] opacity-70">{error.message}</span>
        </div>,
        {
          id: loadingToast,
          style: {
            background: '#0A0A0A',
            color: '#fff',
            border: '1px solid rgba(239,68,68,0.1)',
            fontFamily: 'monospace'
          }
        }
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-mono">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <TerminalIcon size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">Bloomberg Terminal Mode</h1>
            <div className="flex items-center gap-2 text-[10px] text-orange-500/60">
              <Activity size={12} />
              <span className="uppercase tracking-widest">Live Market Intelligence</span>
              <span className="mx-1">•</span>
              <Globe size={12} />
              <span className="uppercase tracking-widest">Global Data Feed</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">XAU/USD Live</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white leading-none">
                  {livePrices['XAU/USD'].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[9px] font-bold ${livePrices['XAU/USD'].isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {livePrices['XAU/USD'].change}
                </span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/40 uppercase font-bold tracking-widest">BTC/USD Live</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white leading-none">
                  {livePrices['BTC/USD'].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[9px] font-bold ${livePrices['BTC/USD'].isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {livePrices['BTC/USD'].change}
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${brokerStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {brokerStatus.connected ? `MT4: ${brokerStatus.accountInfo?.balance?.toFixed(2)} ${brokerStatus.accountInfo?.currency}` : 'Broker Offline'}
            </span>
          </div>
          <button
            onClick={generateAnalysis}
            disabled={loading}
            className="p-2 rounded-lg bg-orange-500 text-black hover:bg-orange-400 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Technicals & Sentiment */}
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Market Sentiment</h3>
              <Zap size={14} className="text-orange-500" />
            </div>
            
            {data ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/60">XAU/USD</span>
                      <span className="text-[7px] px-1 bg-orange-500/20 text-orange-500 rounded border border-orange-500/30 font-bold">LIVE</span>
                    </div>
                    <span className={`text-[10px] font-bold ${livePrices['XAU/USD'].isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {livePrices['XAU/USD'].change}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${data.sentiment.xau.label.includes('BULL') ? 'text-green-500' : 'text-red-500'}`}>
                      {data.sentiment.xau.label}
                    </span>
                    <span className="text-xs text-white/40">{data.sentiment.xau.value}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.sentiment.xau.value}%` }}
                      className={`h-full ${data.sentiment.xau.label.includes('BULL') ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/60">BTC/USD</span>
                      <span className="text-[7px] px-1 bg-orange-500/20 text-orange-500 rounded border border-orange-500/30 font-bold">LIVE</span>
                    </div>
                    <span className={`text-[10px] font-bold ${livePrices['BTC/USD'].isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {livePrices['BTC/USD'].change}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${data.sentiment.btc.label.includes('BULL') ? 'text-green-500' : 'text-red-500'}`}>
                      {data.sentiment.btc.label}
                    </span>
                    <span className="text-xs text-white/40">{data.sentiment.btc.value}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${data.sentiment.btc.value}%` }}
                      className={`h-full ${data.sentiment.btc.label.includes('BULL') ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-white/5 rounded-lg"></div>
                <div className="h-12 bg-white/5 rounded-lg"></div>
              </div>
            )}
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border-b border-white/5 pb-2">Technical Indicators</h3>
            {data ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] text-white/40 uppercase">RSI (14)</span>
                  <span className="text-xs font-bold text-white">{data.indicators.rsi}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] text-white/40 uppercase">Volatility</span>
                  <span className="text-xs font-bold text-orange-500">{data.indicators.volatility}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] text-white/40 uppercase">24h Volume</span>
                  <span className="text-xs font-bold text-white">{data.indicators.volume24h}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-full"></div>
                <div className="h-4 bg-white/5 rounded w-full"></div>
                <div className="h-4 bg-white/5 rounded w-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Chart & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                {(['XAU/USD', 'BTC/USD'] as Pair[]).map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-tighter transition-all ${
                      selectedPair === pair ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                {(['1M', '5M', '1H', '4H', '1D'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-tighter transition-all ${
                      selectedTimeframe === tf ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#ffffff20" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    minTickGap={40}
                  />
                  <YAxis 
                    stroke="#ffffff20" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    domain={['auto', 'auto']}
                    orientation="right"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff10', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Area 
                    type="stepAfter" 
                    dataKey="price" 
                    stroke="#f97316" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    animationDuration={500}
                  />
                  {/* EMA Lines for Scalping */}
                  <Area type="monotone" dataKey="ema8" stroke="#3b82f6" strokeWidth={1} fill="transparent" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="ema21" stroke="#ef4444" strokeWidth={1} fill="transparent" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-[8px] uppercase tracking-widest text-white/30 font-bold">
              <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-orange-500" /> Price</div>
              <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-blue-500 border-t border-dashed" /> EMA 8</div>
              <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-red-500 border-t border-dashed" /> EMA 21</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 relative min-h-[300px]">
              <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                <Activity size={14} />
                {orderType === 'SCALP' ? 'Scalping Strategy' : 'Swing Strategy'}
              </h3>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-full"></div>
                  <div className="h-4 bg-white/5 rounded w-5/6"></div>
                  <div className="h-4 bg-white/5 rounded w-4/6"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="text-red-500 mx-auto mb-2" size={32} />
                  <p className="text-xs text-white/40">{error}</p>
                </div>
              ) : data ? (
                <div className="prose prose-invert max-w-none text-[11px] leading-relaxed text-white/70">
                  <ReactMarkdown>{data.analysis}</ReactMarkdown>
                </div>
              ) : null}
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
              <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                <Clock size={14} />
                Time & Sales (Tape)
              </h3>
              <div className="space-y-1 h-[220px] overflow-hidden">
                <div className="grid grid-cols-4 text-[8px] text-white/20 font-bold uppercase tracking-widest pb-1 border-b border-white/5">
                  <span>Time</span>
                  <span>Price</span>
                  <span>Size</span>
                  <span className="text-right">Side</span>
                </div>
                {tape.map((entry) => (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-4 text-[9px] py-1 border-b border-white/5 font-mono"
                  >
                    <span className="text-white/40">{entry.time}</span>
                    <span className="text-white font-bold">{entry.price.toFixed(2)}</span>
                    <span className="text-white/60">{entry.size}</span>
                    <span className={`text-right font-bold ${entry.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                      {entry.side}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Levels & Trading */}
        <div className="space-y-6">
          {/* Trading Panel */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} />
                Order Entry
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    if (orderType === 'SCALP') setUseCustomScalp(!useCustomScalp);
                    else setUseCustomSwing(!useCustomSwing);
                  }}
                  className={`text-[8px] px-2 py-0.5 rounded border transition-all font-bold uppercase tracking-widest mr-2 ${
                    (orderType === 'SCALP' ? useCustomScalp : useCustomSwing) ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10 text-white/40'
                  }`}
                >
                  {(orderType === 'SCALP' ? useCustomScalp : useCustomSwing) ? 'Custom ON' : 'Custom OFF'}
                </button>
                <button 
                  onClick={() => setOrderType('SCALP')}
                  className={`text-[8px] px-2 py-0.5 rounded border transition-all font-bold uppercase tracking-widest ${
                    orderType === 'SCALP' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/40'
                  }`}
                >
                  Scalp
                </button>
                <button 
                  onClick={() => setOrderType('SWING')}
                  className={`text-[8px] px-2 py-0.5 rounded border transition-all font-bold uppercase tracking-widest ${
                    orderType === 'SWING' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/40'
                  }`}
                >
                  Swing
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Lot Size</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" size={10} />
                    <input 
                      type="text" 
                      value={lotSize}
                      onChange={(e) => setLotSize(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-6 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Entry Price</label>
                  <input 
                    type="text" 
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Stop Loss</label>
                    {(orderType === 'SCALP' ? useCustomScalp : useCustomSwing) && (
                      <span className="text-[7px] text-blue-400 font-bold uppercase">Manual</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={orderType === 'SWING' ? swingStopLoss : stopLoss}
                    onChange={(e) => orderType === 'SWING' ? setSwingStopLoss(e.target.value) : setStopLoss(e.target.value)}
                    readOnly={orderType === 'SWING' ? !useCustomSwing : !useCustomScalp}
                    className={`w-full bg-white/5 border border-red-500/20 rounded px-2 py-1.5 text-xs font-bold text-red-400 focus:outline-none focus:border-red-500/50 transition-colors ${
                      (orderType === 'SWING' ? !useCustomSwing : !useCustomScalp) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[8px] text-white/30 uppercase font-bold tracking-widest">Take Profit</label>
                    {(orderType === 'SCALP' ? useCustomScalp : useCustomSwing) && (
                      <span className="text-[7px] text-blue-400 font-bold uppercase">Manual</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    value={orderType === 'SWING' ? swingTakeProfit : takeProfit}
                    onChange={(e) => orderType === 'SWING' ? setSwingTakeProfit(e.target.value) : setTakeProfit(e.target.value)}
                    readOnly={orderType === 'SWING' ? !useCustomSwing : !useCustomScalp}
                    className={`w-full bg-white/5 border border-green-500/20 rounded px-2 py-1.5 text-xs font-bold text-green-400 focus:outline-none focus:border-green-500/50 transition-colors ${
                      (orderType === 'SWING' ? !useCustomSwing : !useCustomScalp) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handlePlaceOrder('BUY')}
                  disabled={isExecuting}
                  className="group relative overflow-hidden bg-green-600 hover:bg-green-500 text-white rounded-lg p-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">BUY</span>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight size={12} />
                      <span className="text-xs font-bold">{livePrices[selectedPair].price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={() => handlePlaceOrder('SELL')}
                  disabled={isExecuting}
                  className="group relative overflow-hidden bg-red-600 hover:bg-red-500 text-white rounded-lg p-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">SELL</span>
                    <div className="flex items-center gap-1">
                      <ArrowDownRight size={12} />
                      <span className="text-xs font-bold">{livePrices[selectedPair].price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
              <Globe size={14} />
              Economic Calendar
            </h3>
            {data ? (
              <div className="space-y-2">
                {data.economicCalendar.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded group hover:border-orange-500/30 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-orange-500">{event.time}</span>
                        <span className="text-[8px] px-1 bg-white/10 text-white/60 rounded font-bold">{event.currency}</span>
                      </div>
                      <span className="text-[10px] text-white font-medium line-clamp-1">{event.event}</span>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      event.impact === 'HIGH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                      event.impact === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} title={`${event.impact} Impact`} />
                  </div>
                ))}
                {data.economicCalendar.length === 0 && (
                  <p className="text-[9px] text-white/20 italic text-center py-4">No high impact events scheduled</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 bg-white/5 rounded"></div>
                <div className="h-10 bg-white/5 rounded"></div>
                <div className="h-10 bg-white/5 rounded"></div>
              </div>
            )}
          </div>

          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border-b border-white/5 pb-2">Price Action Levels</h3>
            {data ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">XAU/USD Levels</span>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        <span className="text-[8px] text-blue-400 uppercase font-bold">Entry</span>
                        <span className="text-xs font-bold text-white">{data.levels.xau.entry}</span>
                      </div>
                      <div className="flex flex-col p-2 bg-red-500/10 border border-red-500/20 rounded">
                        <span className="text-[8px] text-red-400 uppercase font-bold">SL</span>
                        <span className="text-xs font-bold text-white">{data.levels.xau.sl}</span>
                      </div>
                      <div className="flex flex-col p-2 bg-green-500/10 border border-green-500/20 rounded">
                        <span className="text-[8px] text-green-400 uppercase font-bold">TP</span>
                        <span className="text-xs font-bold text-white">{data.levels.xau.tp}</span>
                      </div>
                    </div>
                    <div className="flex justify-between p-2 bg-red-500/5 border border-red-500/10 rounded">
                      <span className="text-[9px] text-red-500/60 uppercase">Resistance</span>
                      <span className="text-xs font-bold text-red-500">{data.levels.xau.resistance}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 border border-white/10 rounded">
                      <span className="text-[9px] text-white/40 uppercase">Pivot</span>
                      <span className="text-xs font-bold text-white">{data.levels.xau.pivot}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-500/5 border border-green-500/10 rounded">
                      <span className="text-[9px] text-green-500/60 uppercase">Support</span>
                      <span className="text-xs font-bold text-green-500">{data.levels.xau.support}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-orange-500/40 uppercase font-bold tracking-widest">XAU/USD Swing (20m-2h)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                      <span className="text-[8px] text-blue-400 uppercase font-bold">Entry</span>
                      <span className="text-xs font-bold text-white">{data.swingLevels.xau.entry}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <span className="text-[8px] text-red-400 uppercase font-bold">SL</span>
                      <span className="text-xs font-bold text-white">{data.swingLevels.xau.sl}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-green-500/10 border border-green-500/20 rounded">
                      <span className="text-[8px] text-green-400 uppercase font-bold">TP</span>
                      <span className="text-xs font-bold text-white">{data.swingLevels.xau.tp}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">BTC/USD Levels</span>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        <span className="text-[8px] text-blue-400 uppercase font-bold">Entry</span>
                        <span className="text-xs font-bold text-white">{data.levels.btc.entry}</span>
                      </div>
                      <div className="flex flex-col p-2 bg-red-500/10 border border-red-500/20 rounded">
                        <span className="text-[8px] text-red-400 uppercase font-bold">SL</span>
                        <span className="text-xs font-bold text-white">{data.levels.btc.sl}</span>
                      </div>
                      <div className="flex flex-col p-2 bg-green-500/10 border border-green-500/20 rounded">
                        <span className="text-[8px] text-green-400 uppercase font-bold">TP</span>
                        <span className="text-xs font-bold text-white">{data.levels.btc.tp}</span>
                      </div>
                    </div>
                    <div className="flex justify-between p-2 bg-red-500/5 border border-red-500/10 rounded">
                      <span className="text-[9px] text-red-500/60 uppercase">Resistance</span>
                      <span className="text-xs font-bold text-red-500">{data.levels.btc.resistance}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white/5 border border-white/10 rounded">
                      <span className="text-[9px] text-white/40 uppercase">Pivot</span>
                      <span className="text-xs font-bold text-white">{data.levels.btc.pivot}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-green-500/5 border border-green-500/10 rounded">
                      <span className="text-[9px] text-green-500/60 uppercase">Support</span>
                      <span className="text-xs font-bold text-green-500">{data.levels.btc.support}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-orange-500/40 uppercase font-bold tracking-widest">BTC/USD Swing (20m-2h)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                      <span className="text-[8px] text-blue-400 uppercase font-bold">Entry</span>
                      <span className="text-xs font-bold text-white">{data.swingLevels.btc.entry}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-red-500/10 border border-red-500/20 rounded">
                      <span className="text-[8px] text-red-400 uppercase font-bold">SL</span>
                      <span className="text-xs font-bold text-white">{data.swingLevels.btc.sl}</span>
                    </div>
                    <div className="flex flex-col p-2 bg-green-500/10 border border-green-500/20 rounded">
                      <span className="text-[8px] text-green-400 uppercase font-bold">TP</span>
                      <span className="text-xs font-bold text-white">{data.swingLevels.btc.tp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 bg-white/5 rounded"></div>
                <div className="h-10 bg-white/5 rounded"></div>
                <div className="h-10 bg-white/5 rounded"></div>
              </div>
            )}
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-orange-500" />
              <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">Terminal Notice</span>
            </div>
            <p className="text-[9px] text-orange-500/60 leading-tight italic">
              Data feed provided by Gemini AI Intelligence. All timestamps are UTC. Market analysis is updated every 15 minutes or upon manual refresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
