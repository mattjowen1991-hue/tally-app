import { tc } from '../utils/themeColors';
import React, { useState } from 'react';
import haptic from '../utils/haptics';

export default function AccountModal({ show, onClose, user, onSignIn, onSignUp, onSignOut, onResetPassword, onGoogleSignIn, syncStatus, onSyncNow, onDeleteAccount, onClearLocalData, lastSynced }) {
  const [mode, setMode] = useState('login'); // login, signup, forgot, account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!show) return null;

  const currentMode = user ? 'account' : mode;

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSignIn(email, password);
      setEmail('');
      setPassword('');
      haptic.success();
    } catch (err) {
      setError(err.message || 'Sign in failed');
      haptic.warning();
    }
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      haptic.warning();
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      haptic.warning();
      return;
    }
    setLoading(true);
    try {
      await onSignUp(email, password);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      haptic.success();
    } catch (err) {
      setError(err.message || 'Sign up failed');
      haptic.warning();
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Enter your email address');
      return;
    }
    setLoading(true);
    try {
      await onResetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
      haptic.success();
    } catch (err) {
      setError(err.message || 'Reset failed');
      haptic.warning();
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await onSignOut();
      setMode('login');
      haptic.medium();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account?\n\nThis will permanently delete:\n• Your Tally account\n• All cloud-synced data\n• All local data on this device\n\nThis action cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? There is no way to recover your data after deletion.')) return;
    setLoading(true);
    try {
      await onDeleteAccount();
      setMode('login');
      haptic.error();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const formatLastSynced = () => {
    if (!lastSynced) return 'Never';
    const d = new Date(lastSynced);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const syncColor = syncStatus === 'synced' ? tc.success : syncStatus === 'syncing' ? tc.warning : syncStatus === 'error' ? tc.danger : 'var(--text-muted)';
  const syncLabel = syncStatus === 'synced' ? '✓ Synced' : syncStatus === 'syncing' ? '↻ Syncing...' : syncStatus === 'error' ? '✗ Sync failed' : 'Not synced';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--modal-overlay)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto',
        background: 'var(--bg-secondary)', borderRadius: '20px 20px 0 0', padding: '24px 20px',
        animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto 20px' }} />

        {/* ── Account View (logged in) ── */}
        {currentMode === 'account' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 12px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)',
              }}>
                {user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px', color: 'var(--text-primary)' }}>Your Account</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, wordBreak: 'break-all' }}>{user?.email}</p>
            </div>

            {/* Sync status */}
            <div style={{
              padding: '16px', borderRadius: '12px', background: 'var(--glass)',
              border: '1px solid var(--border)', marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Cloud Sync</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: syncColor }}>{syncLabel}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Last synced: {formatLastSynced()}
              </div>
              <button onClick={onSyncNow} disabled={loading || syncStatus === 'syncing'} style={{
                width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.5 : 1,
              }}>
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Sign Out */}
            <button onClick={handleSignOut} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '500',
              cursor: 'pointer', marginBottom: '24px',
            }}>
              Sign Out
            </button>

            {/* Danger Zone */}
            <div style={{
              padding: '16px', borderRadius: '12px', border: `1px solid ${tc.dangerTint}`,
              background: tc.dangerTintLight,
            }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: tc.danger, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Danger Zone</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>These actions cannot be undone.</p>

              <button onClick={onClearLocalData} disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', marginBottom: '10px', textAlign: 'left',
              }}>
                🗑️ &nbsp;Remove data from this device
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Clears local data only. Your cloud backup is not affected.
                </span>
              </button>

              <button onClick={handleDeleteAccount} disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${tc.dangerTintStrong}`,
                background: 'transparent', color: tc.danger, fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', textAlign: 'left',
              }}>
                ⚠️ &nbsp;Delete account & all data
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Permanently deletes your account, cloud data, and local data. This cannot be reversed.
                </span>
              </button>
            </div>

            {error && <p style={{ color: tc.danger, fontSize: '13px', textAlign: 'center', margin: '12px 0 0' }}>{error}</p>}
          </>
        )}

        {/* ── Login View ── */}
        {currentMode === 'login' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px', textAlign: 'center', color: 'var(--text-primary)' }}>Welcome Back</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 24px' }}>Sign in to sync your data</p>

            <form onSubmit={handleSignIn}>
              <input
                type="email" placeholder="Email address" value={email} autoComplete="email"
                onChange={e => setEmail(e.target.value)} required
                style={inputStyle}
              />
              <input
                type="password" placeholder="Password" value={password} autoComplete="current-password"
                onChange={e => setPassword(e.target.value)} required
                style={inputStyle}
              />
              {error && <p style={{ color: tc.danger, fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button onClick={onGoogleSignIn} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)',
              background: 'var(--glass)', color: 'var(--text-primary)', fontSize: '15px',
              fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <button onClick={() => switchMode('forgot')} style={linkBtnStyle}>Forgot password?</button>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Don't have an account? </span>
              <button onClick={() => switchMode('signup')} style={{ ...linkBtnStyle, display: 'inline', margin: 0, fontWeight: '600' }}>Sign Up</button>
            </div>
          </>
        )}

        {/* ── Sign Up View ── */}
        {currentMode === 'signup' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px', textAlign: 'center', color: 'var(--text-primary)' }}>Create Account</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 24px' }}>Sync your finances across devices</p>

            <form onSubmit={handleSignUp}>
              <input
                type="email" placeholder="Email address" value={email} autoComplete="email"
                onChange={e => setEmail(e.target.value)} required
                style={inputStyle}
              />
              <input
                type="password" placeholder="Password (8+ characters)" value={password} autoComplete="new-password"
                onChange={e => setPassword(e.target.value)} required minLength={8}
                style={inputStyle}
              />
              <input
                type="password" placeholder="Confirm password" value={confirmPassword} autoComplete="new-password"
                onChange={e => setConfirmPassword(e.target.value)} required
                style={inputStyle}
              />
              {error && <p style={{ color: tc.danger, fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <button onClick={onGoogleSignIn} disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)',
              background: 'var(--glass)', color: 'var(--text-primary)', fontSize: '15px',
              fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Already have an account? </span>
              <button onClick={() => switchMode('login')} style={{ ...linkBtnStyle, display: 'inline', margin: 0, fontWeight: '600' }}>Sign In</button>
            </div>
          </>
        )}

        {/* ── Forgot Password View ── */}
        {currentMode === 'forgot' && (
          <>
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px', textAlign: 'center', color: 'var(--text-primary)' }}>Reset Password</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 24px' }}>We'll send you a reset link</p>

            <form onSubmit={handleResetPassword}>
              <input
                type="email" placeholder="Email address" value={email} autoComplete="email"
                onChange={e => setEmail(e.target.value)} required
                style={inputStyle}
              />
              {error && <p style={{ color: tc.danger, fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
              {message && <p style={{ color: tc.success, fontSize: '13px', margin: '0 0 12px' }}>{message}</p>}
              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <button onClick={() => switchMode('login')} style={linkBtnStyle}>← Back to Sign In</button>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)',
  background: 'var(--glass)', color: 'var(--text-primary)', fontSize: '15px',
  marginBottom: '12px', outline: 'none', boxSizing: 'border-box',
};

const primaryBtnStyle = {
  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff',
  fontSize: '16px', fontWeight: '600', cursor: 'pointer',
};

const linkBtnStyle = {
  background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '14px',
  cursor: 'pointer', display: 'block', margin: '12px auto 0', padding: 0,
};
