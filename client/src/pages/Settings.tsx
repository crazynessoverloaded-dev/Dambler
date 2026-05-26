import { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '@/components/MainLayout';
import { User, Lock, Eye, EyeOff, Upload, Save, AlertCircle, CheckCircle } from 'lucide-react';

const inp = (err?: boolean): React.CSSProperties => ({
  width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '11px 14px',
  fontSize: 13.5, color: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  border: err ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(255,255,255,0.09)',
});

const label: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 7, display: 'block' };
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '28px 32px' };

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile'|'password'>('profile');
  const [profileData, setProfileData] = useState({ firstName:'John', lastName:'Doe', email:'john@example.com', birthday:'1990-01-15', pfp:'https://api.dicebear.com/7.x/avataaars/svg?seed=John' });
  const [passwordData, setPasswordData] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [showPasswords, setShowPasswords] = useState({ current:false, new:false, confirm:false });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [success, setSuccess] = useState('');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]:value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]:'' }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]:value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]:'' }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string,string> = {};
    if (!profileData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!profileData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!profileData.birthday) newErrors.birthday = 'Birthday is required';
    setErrors(newErrors);
    if (!Object.keys(newErrors).length) { setSuccess('Profile updated successfully!'); setTimeout(() => setSuccess(''),3000); }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string,string> = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Required';
    if (!passwordData.newPassword) newErrors.newPassword = 'Required';
    if (passwordData.newPassword.length < 8) newErrors.newPassword = 'At least 8 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (!Object.keys(newErrors).length) { setSuccess('Password changed!'); setPasswordData({ currentPassword:'',newPassword:'',confirmPassword:'' }); setTimeout(() => setSuccess(''),3000); }
  };

  const navBtn = (t: string): React.CSSProperties => ({
    width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:10,
    background: activeTab===t ? 'rgba(255,255,255,0.08)' : 'transparent',
    border: activeTab===t ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
    color: activeTab===t ? '#fff' : 'rgba(255,255,255,0.4)',
    fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', textAlign:'left',
  });

  return (
    <MainLayout>
      <div style={{ background:'#0f1118', minHeight:'100vh' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'52px 24px 80px' }}>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:36 }}>
            <p style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:1.2, marginBottom:10 }}>Account</p>
            <h1 style={{ fontSize:38, fontWeight:800, color:'#fff', letterSpacing:-1, margin:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>Settings</h1>
          </motion.div>

          {success && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} style={{ background:'rgba(74,222,128,0.08)', border:'1px solid rgba(255,255,255,0.0)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircle style={{ width:14,height:14,color:'#4ade80',flexShrink:0 }} />
              <p style={{ fontSize:13, color:'#4ade80', margin:0 }}>{success}</p>
            </motion.div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, alignItems:'start' }}>
            {/* Sidebar */}
            <motion.div initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.08 }}
              style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'8px' }}>
              {[{ id:'profile', icon:User, label:'Profile' }, { id:'password', icon:Lock, label:'Password' }].map(({ id, icon:Icon, label:lbl }) => (
                <button key={id} onClick={() => setActiveTab(id as any)} style={navBtn(id)}>
                  <Icon style={{ width:15, height:15 }} /> {lbl}
                </button>
              ))}
            </motion.div>

            {/* Content */}
            <motion.div initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}>
              {activeTab==='profile' && (
                <div style={card}>
                  <p style={{ fontSize:16, fontWeight:800, color:'#fff', margin:'0 0 24px', letterSpacing:-0.2 }}>Profile Settings</p>

                  {/* Avatar */}
                  <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:28, paddingBottom:24, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <img src={profileData.pfp} alt="Profile" style={{ width:64, height:64, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)' }} />
                    <div>
                      <button style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 14px', color:'rgba(255,255,255,0.65)', fontSize:12.5, fontWeight:600, cursor:'pointer', marginBottom:6 }}>
                        <Upload style={{ width:13,height:13 }} /> Change Picture
                      </button>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.28)', margin:0 }}>JPG, PNG or GIF (max 5MB)</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                      <div>
                        <span style={label}>First Name</span>
                        <input name="firstName" value={profileData.firstName} onChange={handleProfileChange} style={inp(!!errors.firstName)} />
                        {errors.firstName && <p style={{ fontSize:11.5, color:'#f87171', margin:'5px 0 0' }}>{errors.firstName}</p>}
                      </div>
                      <div>
                        <span style={label}>Last Name</span>
                        <input name="lastName" value={profileData.lastName} onChange={handleProfileChange} style={inp(!!errors.lastName)} />
                        {errors.lastName && <p style={{ fontSize:11.5, color:'#f87171', margin:'5px 0 0' }}>{errors.lastName}</p>}
                      </div>
                    </div>
                    <div>
                      <span style={label}>Email Address</span>
                      <input value={profileData.email} disabled style={{ ...inp(), background:'rgba(255,255,255,0.02)', color:'rgba(255,255,255,0.3)', cursor:'not-allowed' }} />
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)', margin:'5px 0 0' }}>Email cannot be changed</p>
                    </div>
                    <div>
                      <span style={label}>Birthday</span>
                      <input type="date" name="birthday" value={profileData.birthday} onChange={handleProfileChange} style={inp(!!errors.birthday)} />
                      {errors.birthday && <p style={{ fontSize:11.5, color:'#f87171', margin:'5px 0 0' }}>{errors.birthday}</p>}
                    </div>
                    <button type="submit" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#fff', color:'#0c0e14', fontWeight:800, fontSize:13.5, padding:'13px', borderRadius:10, border:'none', cursor:'pointer', marginTop:4 }}>
                      <Save style={{ width:14,height:14 }} /> Save Changes
                    </button>
                  </form>
                </div>
              )}

              {activeTab==='password' && (
                <div style={card}>
                  <p style={{ fontSize:16, fontWeight:800, color:'#fff', margin:'0 0 6px', letterSpacing:-0.2 }}>Change Password</p>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', margin:'0 0 24px' }}>Keep your account secure with a strong password.</p>

                  <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:10, padding:'12px 16px', marginBottom:24, display:'flex', alignItems:'flex-start', gap:10 }}>
                    <AlertCircle style={{ width:14,height:14,color:'#fbbf24',flexShrink:0,marginTop:1 }} />
                    <p style={{ fontSize:12.5, color:'rgba(251,191,36,0.8)', margin:0, lineHeight:1.55 }}>Use at least 8 characters including uppercase, lowercase, and numbers.</p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                    {[
                      { key:'currentPassword', lbl:'Current Password', field:'current' as const },
                      { key:'newPassword',     lbl:'New Password',     field:'new' as const     },
                      { key:'confirmPassword', lbl:'Confirm Password', field:'confirm' as const },
                    ].map(({ key, lbl, field }) => (
                      <div key={key}>
                        <span style={label}>{lbl}</span>
                        <div style={{ position:'relative' }}>
                          <input
                            type={showPasswords[field] ? 'text' : 'password'}
                            name={key}
                            value={(passwordData as any)[key]}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                            style={{ ...inp(!!errors[key]), paddingRight:44 }}
                          />
                          <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, [field]:!prev[field] }))}
                            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:2 }}>
                            {showPasswords[field] ? <EyeOff style={{ width:16,height:16,color:'rgba(255,255,255,0.35)' }} /> : <Eye style={{ width:16,height:16,color:'rgba(255,255,255,0.35)' }} />}
                          </button>
                        </div>
                        {errors[key] && <p style={{ fontSize:11.5, color:'#f87171', margin:'5px 0 0' }}>{errors[key]}</p>}
                      </div>
                    ))}
                    <button type="submit" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#fff', color:'#0c0e14', fontWeight:800, fontSize:13.5, padding:'13px', borderRadius:10, border:'none', cursor:'pointer', marginTop:4 }}>
                      <Lock style={{ width:14,height:14 }} /> Update Password
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

