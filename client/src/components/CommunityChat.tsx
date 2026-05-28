import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Link } from 'wouter';

const NAV_H = 56;

function nowTime(d: Date | string) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function CommunityChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();

  const { data: statsData } = trpc.wallet.liveStats.useQuery(undefined, { refetchInterval: 60_000 });
  const online = statsData?.activeUsers ?? 0;

  const { data: messages = [] } = trpc.chat.getMessages.useQuery(undefined, {
    refetchInterval: open ? 2500 : 10_000,
    staleTime: 0,
  });

  const utils = trpc.useUtils();
  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
      setInput('');
      setSendError('');
    },
    onError: (err) => setSendError(err.message),
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate({ text });
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ top: `calc(50% + ${NAV_H / 2}px)` }}
          className="fixed left-0 -translate-y-1/2 z-40 bg-accent text-background px-1.5 py-5 rounded-r-xl flex flex-col items-center gap-2 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-[9px] font-black tracking-widest" style={{ writingMode: 'vertical-rl' }}>CHAT</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            style={{ top: NAV_H }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed left-0 w-80 bg-background/95 backdrop-blur-md border-r border-border z-50 flex flex-col shadow-2xl"
            style={{ top: NAV_H, height: `calc(100vh - ${NAV_H}px)` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 flex-shrink-0">
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
              {messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  No messages yet — be the first!
                </div>
              )}
              {messages.map(msg => {
                const isSelf = isAuthenticated && user?.username === msg.username;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col gap-0.5 ${isSelf ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-accent">{msg.username}</span>
                      <span className="text-[9px] text-muted-foreground">{nowTime(msg.createdAt)}</span>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                      isSelf
                        ? 'bg-accent text-background rounded-tr-sm'
                        : 'bg-accent/10 text-foreground border border-accent/10 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex-shrink-0">
              {!isAuthenticated ? (
                <div className="text-center py-2">
                  <p className="text-[11px] text-muted-foreground mb-2">Login to chat</p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/login">
                      <button className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-accent text-background">Login</button>
                    </Link>
                    <Link href="/register">
                      <button className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-border text-muted-foreground">Register</button>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-background/60 border border-accent/20 rounded-xl px-3 py-2 focus-within:border-accent/50 transition-colors">
                    <input
                      value={input}
                      onChange={e => { setInput(e.target.value); setSendError(''); }}
                      onKeyDown={e => e.key === 'Enter' && send()}
                      placeholder="Say something…"
                      maxLength={200}
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button onClick={send} disabled={!input.trim() || sendMutation.isPending}
                      className="p-1.5 rounded-lg bg-accent text-background disabled:opacity-40 hover:bg-accent/90 transition-colors flex-shrink-0">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {sendError && <p className="text-[10px] text-red-400 mt-1">{sendError}</p>}
                  <p className="text-[9px] text-muted-foreground mt-1.5 text-center">Be respectful · No spam · English only</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
