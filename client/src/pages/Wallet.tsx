import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { ArrowDownLeft, ArrowUpRight, Zap, Lock, FlaskConical } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';


const MOCK_TXS = [
  { id:'TXN-8821', type:'deposit',  amount:500,   currency:'USDT', status:'confirmed', time:'2m ago',  hash:'0x3f2a9c8b1d7e4f52' },
  { id:'TXN-8820', type:'withdraw', amount:0.125, currency:'ETH',  status:'confirmed', time:'1h ago',  hash:'0x7b9c1d4e2a8f3c61' },
  { id:'TXN-8819', type:'deposit',  amount:1000,  currency:'DMB',  status:'pending',   time:'3h ago',  hash:'0x1d4e8f2a9c3b7e50' },
  { id:'TXN-8818', type:'withdraw', amount:50,    currency:'USDT', status:'confirmed', time:'5h ago',  hash:'0x9c8b1d4e2a7f3c62' },
  { id:'TXN-8817', type:'deposit',  amount:0.5,   currency:'ETH',  status:'confirmed', time:'1d ago',  hash:'0x2a7f3c619c8b1d4e' },
  { id:'TXN-8816', type:'withdraw', amount:200,   currency:'DMB',  status:'failed',    time:'2d ago',  hash:'0x4f52a7b91d8c3e62' },
  { id:'TXN-8815', type:'deposit',  amount:2000,  currency:'USDT', status:'confirmed', time:'3d ago',  hash:'0x8c3e62a7b91d4f52' },
];

const CURRENCIES = ['USDT','ETH','BTC','DMB','SOL'];
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '22px 24px' };
const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '11px 14px', fontSize: 13.5, color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' };

function truncAddr(a: string) { return a.slice(0,7)+'…'+a.slice(-5); }

function StatusBadge({ status }: { status: string }) {
  const color = status==='confirmed' ? '#4ade80' : status==='pending' ? '#fbbf24' : '#f87171';
  const bg = status==='confirmed' ? 'rgba(255,255,255,0.0)' : status==='pending' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)';
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color, border: `1px solid ${color}30` }}>{status}</span>;
}

export default function WalletPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'deposit'|'withdraw'|'history'>('history');

  const balanceQuery = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated, staleTime: 0 });
  const dmbBalance = balanceQuery.data?.balance ?? 0;

  const tabBtn = (t: string): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    background: tab===t ? 'rgba(255,255,255,0.1)' : 'transparent',
    border: tab===t ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
    color: tab===t ? '#fff' : 'rgba(255,255,255,0.38)',
    display: 'flex', alignItems: 'center',
  });

  return (
    <MainLayout>
      <div style={{ background: '#0f1118', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '52px 24px 80px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Wallet</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1, margin: '0 0 6px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Wallet</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Your DMB balance and activity during the testing phase.</p>
              </div>
              {/* DMB balance card */}
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 14, padding: '14px 22px', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 4 }}>DMB BALANCE</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>${dmbBalance.toFixed(2)}</div>
              </div>
            </div>
          </motion.div>

          {/* Testing phase banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical style={{ width: 16, height: 16, color: '#f59e0b' }} />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: '#f59e0b', margin: '0 0 4px' }}>Testing Phase — Demo Money Only</p>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
                Dambler is currently in its testing phase. Every account starts with <strong style={{ color: 'rgba(255,255,255,0.7)' }}>$1,000 DMB</strong> in free demo funds to explore all games.
                Real deposits, withdrawals, and wallet connections are <strong style={{ color: 'rgba(255,255,255,0.7)' }}>not available yet</strong> — they will unlock when we go live.
                Top players earn <strong style={{ color: 'rgba(255,255,255,0.7)' }}>real DMB coin rewards</strong> at campaign end based on the XP leaderboard.
              </p>
            </div>
          </motion.div>

          {/* Locked wallet connectors */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[{ emoji: '🦊', name: 'MetaMask', sub: 'Ethereum & EVM' }, { emoji: '👻', name: 'Phantom', sub: 'Solana network' }].map(w => (
              <div key={w.name} style={{ ...card, opacity: 0.5, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>{w.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{w.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>{w.sub}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 20, letterSpacing: 1 }}>COMING SOON</span>
                </div>
                <div style={{ width: '100%', padding: '10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                  <Lock style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Not available in testing phase</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Tabs — deposit & withdraw locked */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
              {(['deposit', 'withdraw', 'history'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>
                  {(t === 'deposit' || t === 'withdraw') && <Lock style={{ width: 10, height: 10, marginRight: 4, opacity: 0.4 }} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {(tab === 'deposit' || tab === 'withdraw') && (
                <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  style={{ ...card, maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 32px', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock style={{ width: 22, height: 22, color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                      {tab === 'deposit' ? 'Deposits' : 'Withdrawals'} Not Available Yet
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.65, maxWidth: 380 }}>
                      Dambler is in its testing phase. Real money {tab === 'deposit' ? 'deposits' : 'withdrawals'} will open
                      when we launch publicly. For now, use your free <strong style={{ color: 'rgba(255,255,255,0.6)' }}>$1,000 DMB</strong> to
                      explore all games and climb the XP leaderboard.
                    </p>
                  </div>
                  <div style={{ marginTop: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 12, color: 'rgba(245,158,11,0.8)' }}>
                    🏆 Top 50 XP players earn real DMB coin rewards at campaign end
                  </div>
                </motion.div>
              )}

              {tab==='history' && (
                <motion.div key="history" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', display:'grid', gridTemplateColumns:'100px 90px 1fr 100px 120px 80px', padding:'10px 8px', marginBottom:2 }}>
                    {['ID','Type','Amount','Status','Hash','Time'].map(c => <span key={c} style={{ fontSize:10, color:'rgba(255,255,255,0.22)', fontWeight:700, letterSpacing:0.8, textTransform:'uppercase' }}>{c}</span>)}
                  </div>
                  <div style={{ position:'relative' }}>
                    {/* Blurred rows — placeholder data, not readable by design */}
                    <div style={{ filter:'blur(5px)', userSelect:'none', pointerEvents:'none' }}>
                      {MOCK_TXS.map((tx, i) => (
                        <div key={tx.id}
                          style={{ display:'grid', gridTemplateColumns:'100px 90px 1fr 100px 120px 80px', padding:'12px 8px', borderBottom: i<MOCK_TXS.length-1?'1px solid rgba(255,255,255,0.04)':undefined, alignItems:'center' }}>
                          <span style={{ fontSize:11.5, fontFamily:'JetBrains Mono, monospace', color:'rgba(255,255,255,0.3)' }}>{tx.id}</span>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            {tx.type==='deposit' ? <ArrowDownLeft style={{ width:12,height:12,color:'#4ade80' }} /> : <ArrowUpRight style={{ width:12,height:12,color:'#f87171' }} />}
                            <span style={{ fontSize:12.5, fontWeight:600, color:tx.type==='deposit'?'#4ade80':'#f87171', textTransform:'capitalize' }}>{tx.type}</span>
                          </div>
                          <span style={{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:'JetBrains Mono, monospace' }}>{tx.amount} {tx.currency}</span>
                          <StatusBadge status={tx.status} />
                          <span style={{ fontSize:11.5, fontFamily:'JetBrains Mono, monospace', color:'rgba(255,255,255,0.3)' }}>{tx.hash.slice(0,10)}…</span>
                          <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.28)' }}>{tx.time}</span>
                        </div>
                      ))}
                    </div>
                    {/* Overlay */}
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, background:'rgba(15,17,24,0.55)', backdropFilter:'blur(2px)', borderRadius:10 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Lock style={{ width:18, height:18, color:'rgba(255,255,255,0.35)' }} />
                      </div>
                      <p style={{ fontSize:13.5, fontWeight:700, color:'rgba(255,255,255,0.7)', margin:0 }}>Transaction history unlocks at launch</p>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>Your real activity will appear here once the platform goes live.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* DMB info */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            style={{ ...card, marginTop:24, display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, padding:10, display:'flex', flexShrink:0 }}>
              <Zap style={{ width:16, height:16, color:'rgba(255,255,255,0.55)' }} />
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:3 }}>Native DMB Coin</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', margin:0, lineHeight:1.55 }}>Use DMB for 0% fees on all deposits and withdrawals, plus earn 2× VIP XP on every bet.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}

