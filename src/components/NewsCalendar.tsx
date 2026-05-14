import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Globe } from 'lucide-react';

export const NewsCalendar = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'news'>('calendar');
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const newsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'calendar' && calendarContainerRef.current) {
      if (calendarContainerRef.current.querySelector('script')) {
        return; // script already injected
      }
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "isTransparent": true,
        "width": "100%",
        "height": "100%",
        "locale": "id",
        "importanceFilter": "-1,0,1",
        "currencyFilter": "USD,EUR,ITL,NZD,CHF,AUD,FRF,JPY,ZAR,TRL,CAD,DEM,MXN,ESP,GBP"
      });
      calendarContainerRef.current.appendChild(script);
    } else if (activeTab === 'news' && newsContainerRef.current) {
      if (newsContainerRef.current.querySelector('script')) {
        return; // script already injected
      }
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
      script.async = true;
      script.innerHTML = JSON.stringify({
        "feedMode": "all_symbols",
        "isTransparent": true,
        "displayMode": "regular",
        "width": "100%",
        "height": "100%",
        "colorTheme": "dark",
        "locale": "id"
      });
      newsContainerRef.current.appendChild(script);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Globe className="text-brand-500" /> Market Intelligence
          </h1>
          <p className="text-sm text-white/50 mt-1">Berita pasar real-time dan kalender ekonomi untuk panduan trading Anda.</p>
        </div>
      </div>

      <div className="flex bg-[#0A0A0A] p-1 rounded-xl border border-white/5 w-fit">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'calendar' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
          }`}
        >
          <CalendarIcon size={16} /> Economic Calendar
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'news' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
          }`}
        >
          <Globe size={16} /> Market News
        </button>
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'calendar' ? (
          <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden h-[600px] relative">
            <div className="tradingview-widget-container" ref={calendarContainerRef} style={{ height: '100%', width: '100%' }}>
              <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
              <div className="tradingview-widget-copyright">
                <a href="https://id.tradingview.com/" rel="noopener nofollow" target="_blank">
                  <span className="blue-text">Kalender Ekonomi dari TradingView</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0A0A] rounded-2xl border border-white/5 overflow-hidden h-[600px] relative">
            <div className="tradingview-widget-container" ref={newsContainerRef} style={{ height: '100%', width: '100%' }}>
              <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
              <div className="tradingview-widget-copyright">
                <a href="https://id.tradingview.com/" rel="noopener nofollow" target="_blank">
                  <span className="blue-text">Berita Pasar dari TradingView</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
