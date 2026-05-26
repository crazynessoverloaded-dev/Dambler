import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';

interface Message {
  id: number;
  from: 'user' | 'support';
  text: string;
  time: string;
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const CANNED_REPLIES = [
  "Thanks for reaching out! A support agent will be with you shortly.",
  "We typically respond within a few minutes. In the meantime, check our FAQ at dambler.com/faq.",
  "I can see your account details. Let me look into that for you right now.",
  "Could you provide your username so I can pull up your account?",
  "That's been resolved on our end. Please refresh and let me know if the issue persists.",
  "I've escalated this to our payments team. You'll receive an email update within 1 hour.",
];

let replyIdx = 0;

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: 'support',
      text: "Hi! Welcome to Dambler Support 👋 How can we help you today?",
      time: now(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !minimised) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, minimised]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg: Message = { id: Date.now(), from: 'user', text, time: now() };
    setMessages(prev => [...prev, userMsg]);

    setTyping(true);
    setTimeout(() => {
      const reply = CANNED_REPLIES[replyIdx % CANNED_REPLIES.length];
      replyIdx++;
      setTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'support', text: reply, time: now() }]);
    }, 1200 + Math.random() * 800);
  };

  return (
    <>
      {/* Bubble button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setOpen(true); setMinimised(false); }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent shadow-lg shadow-accent/40 flex items-center justify-center hover:bg-accent/90 transition-all"
          >
            <MessageCircle className="h-6 w-6 text-background"/>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background"/>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl border border-accent/20 flex flex-col"
            style={{ maxHeight: minimised ? 'auto' : 480 }}
          >
            {/* Header */}
            <div className="bg-accent px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center text-sm font-bold text-background">D</div>
                <div>
                  <p className="text-xs font-bold text-background">Dambler Support</p>
                  <p className="text-xs text-background/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block"/>Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimised(m => !m)} className="p-1.5 rounded-lg hover:bg-background/20 text-background transition-colors">
                  <Minimize2 className="h-3.5 w-3.5"/>
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-background/20 text-background transition-colors">
                  <X className="h-3.5 w-3.5"/>
                </button>
              </div>
            </div>

            {!minimised && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-background p-3 space-y-3" style={{ minHeight: 0, maxHeight: 340 }}>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.from === 'user'
                          ? 'bg-accent text-background rounded-br-sm'
                          : 'bg-accent/10 border border-accent/20 text-foreground rounded-bl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.from === 'user' ? 'text-background/60 text-right' : 'text-muted-foreground'}`}>{msg.time}</p>
                      </div>
                    </div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-accent/10 border border-accent/20 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1">
                          {[0,1,2].map(i => (
                            <motion.span key={i} className="w-1.5 h-1.5 bg-accent rounded-full"
                              animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}/>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>

                {/* Input */}
                <div className="bg-background border-t border-border p-3 flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Type a message..."
                    className="flex-1 bg-accent/5 border border-accent/20 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors"
                  />
                  <button onClick={send} className="w-8 h-8 rounded-xl bg-accent hover:bg-accent/90 flex items-center justify-center transition-all flex-shrink-0">
                    <Send className="h-3.5 w-3.5 text-background"/>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
