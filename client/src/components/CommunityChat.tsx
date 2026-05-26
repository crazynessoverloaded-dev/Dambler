import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Users } from 'lucide-react';

interface Msg { id: number; user: string; text: string; self?: boolean; time: string; }

const USERS = [
  'CryptoKing_99','LuckyPlayer42','HighRoller_X','DiamondHands7','MoonShot88',
  'PlinkoPro','CrashKing_21','StakeLord','NightOwl_222','DMBwhale',
  'SatoshiG','BasedChad','GigaBrain','RetailTrader','CoinFlipPro',
];

const POOL = [
  'just hit 15x on Crash 🔥','anyone playing Plinko rn?','Blackjack is hitting different today',
  'lost 3 in a row on roulette 😭','DMB to the moon 🌙','this site is so clean ngl',
  'just deposited, time to grind','Mines got me again lmao','got the 20x bucket on Plinko!!!',
  'daily spin gave me $25!','who else is up rn?','baccarat is underrated fr',
  'going all in on crash, wish me luck','😱 JUST HIT $500 on slots','cashed out at 2.5x, playing safe',
  'these odds are actually fair tho','checking provably fair — legit!','hi from aus 👋',
  'anyone know good Blackjack strategy?','wagering for the weekly leaderboard grind',
  'VIP gold grind is real 💎','DMB pumping again let\'s gooo','this crash game is addicting',
  'bro i just got 200 DMB from the daily spin','down bad on roulette rn ngl',
];

function rndUser() { return USERS[Math.floor(Math.random() * USERS.length)]; }
function rndMsg()  { return POOL[Math.floor(Math.random() * POOL.length)]; }
function nowTime() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

const INITIAL: Msg[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  user: rndUser(),
  text: rndMsg(),
  time: nowTime(),
}));

export default function CommunityChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState('');
  const [online] = useState(() => 1200 + Math.floor(Math.random() * 300));
  const bottomRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(100);

  // Auto-generate messages
  useEffect(() => {
    const schedule = () => {
      const delay = 3000 + Math.random() * 5000;
      return setTimeout(() => {
        const msg: Msg = { id: idRef.current++, user: rndUser(), text: rndMsg(), time: nowTime() };
        setMessages(prev => [...prev.slice(-49), msg]);
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  }, []);

  // Scroll to bottom on new messages (only when open)
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Msg = { id: idRef.current++, user: 'You', text, self: true, time: nowTime() };
    setMessages(prev => [...prev.slice(-49), msg]);
    setInput('');
  };

  return (
    <>
      {/* Pull-out tab on right edge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-accent text-background px-1.5 py-5 rounded-l-xl flex flex-col items-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-[9px] font-black tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>CHAT</span>
        </button>
      )}

      {/* Backdrop (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-screen w-80 bg-background/95 backdrop-blur-md border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold text-foreground">Community Chat</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{online.toLocaleString()}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
                <button onClick={() => setOpen(false)} className="p-1 hover:text-accent transition-colors">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col gap-0.5 ${msg.self ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5">
                    {!msg.self && <span className="text-[10px] font-bold text-accent">{msg.user}</span>}
                    {msg.self && <span className="text-[10px] font-bold text-accent">You</span>}
                    <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    msg.self
                      ? 'bg-accent text-background rounded-tr-sm'
                      : 'bg-accent/10 text-foreground border border-accent/10 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 bg-background/60 border border-accent/20 rounded-xl px-3 py-2 focus-within:border-accent/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Say something…"
                  maxLength={200}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button onClick={send} disabled={!input.trim()}
                  className="p-1.5 rounded-lg bg-accent text-background disabled:opacity-40 hover:bg-accent/90 transition-colors flex-shrink-0">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5 text-center">Be respectful · No spam · English only</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
