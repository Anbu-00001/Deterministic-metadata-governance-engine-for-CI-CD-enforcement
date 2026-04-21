'use client';

import { useState } from 'react';
import { T } from '../tokens';
import { BrowserBar } from '../shared/BrowserBar';
import { TopBar } from '../shared/TopBar';
import { Field } from '../ui/Field';
import { PrimaryBtn } from '../ui/PrimaryBtn';
import { GhostBtn } from '../ui/GhostBtn';
import { Checkbox } from '../ui/Checkbox';

interface Screen2Props {
  onNext: () => void;
  onBack: () => void;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const colors = [T.line, T.err, T.amber, T.lime, T.ok];
  return (
    <div style={{ display: 'flex', gap: 4, width: '100%' }}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? colors[strength] : T.line }} />
      ))}
    </div>
  );
}

function strengthLabel(password: string) {
  if (password.length === 0) return '';
  if (password.length < 6) return 'Weak';
  if (password.length < 10) return 'Fair';
  if (password.length < 14) return 'Good';
  return 'Strong';
}

function strengthColor(password: string) {
  if (password.length === 0) return T.mute;
  if (password.length < 6) return T.err;
  if (password.length < 10) return T.amber;
  if (password.length < 14) return T.lime;
  return T.ok;
}

export function Screen2({ onNext, onBack }: Screen2Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const domainVerified = email.includes('@') && email.split('@')[1]?.includes('.');

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!email.includes('@')) e.email = 'Invalid email';
    if (password.length < 8) e.password = 'Min 8 characters';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (validate()) onNext();
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <BrowserBar />
      <TopBar step={2} />
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        overflowY: 'auto',
      }}>
        <div style={{
          width: 460,
          background: T.card,
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          padding: 36,
          boxShadow: '0 1px 2px rgba(10,20,50,0.04), 0 8px 32px rgba(10,20,50,0.06)',
        }}>
          <div style={{
            fontSize: 10.5,
            fontFamily: T.mono,
            color: T.navy,
            fontWeight: 600,
            letterSpacing: 0.6,
            marginBottom: 8,
          }}>
            STEP 02 / 05
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: -0.5, fontFamily: T.sans }}>
            Create your account
          </h2>
          <p style={{ fontSize: 13, color: T.mute, marginTop: 6, marginBottom: 24, lineHeight: 1.5, fontFamily: T.sans }}>
            Use your work email — SSO auto-enables for verified domains.
          </p>

          <div style={{ display: 'grid', gap: 14 }}>
            <Field
              label="Full name"
              value={name}
              placeholder="Jane Smith"
              onChange={setName}
              error={!!errors.name}
              hint={errors.name ? <span style={{ color: T.err }}>{errors.name}</span> : undefined}
            />
            <Field
              label="Work email"
              value={email}
              placeholder="jane@company.io"
              type="email"
              onChange={setEmail}
              error={!!errors.email}
              hint={
                errors.email
                  ? <span style={{ color: T.err }}>{errors.email}</span>
                  : domainVerified
                  ? <><span style={{ color: T.ok }}>●</span> Domain verified · SSO available</>
                  : undefined
              }
              hintColor={domainVerified && !errors.email ? T.ok : undefined}
            />
            <Field
              label="Password"
              value={password}
              placeholder="Min 8 characters"
              type="password"
              mono
              onChange={setPassword}
              error={!!errors.password}
              right={
                password
                  ? <span style={{ textTransform: 'none', color: strengthColor(password), fontWeight: 500, fontFamily: T.sans }}>
                      {strengthLabel(password)}
                    </span>
                  : undefined
              }
              hint={
                errors.password
                  ? <span style={{ color: T.err }}>{errors.password}</span>
                  : password
                  ? <PasswordStrengthBar password={password} />
                  : undefined
              }
            />
            <Field
              label="Confirm password"
              value={confirm}
              placeholder="Re-enter password"
              type="password"
              mono
              onChange={setConfirm}
              error={!!errors.confirm}
              hint={errors.confirm ? <span style={{ color: T.err }}>{errors.confirm}</span> : undefined}
            />
          </div>

          {errors.agreed && (
            <p style={{ fontSize: 11, color: T.err, margin: '12px 0 0', fontFamily: T.sans }}>{errors.agreed}</p>
          )}

          <div style={{ marginTop: 20 }}>
            <Checkbox
              checked={agreed}
              onChange={setAgreed}
              label={
                <>
                  I agree to the{' '}
                  <span style={{ color: T.navy, textDecoration: 'underline', cursor: 'pointer' }}>Terms</span>
                  {' '}and{' '}
                  <span style={{ color: T.navy, textDecoration: 'underline', cursor: 'pointer' }}>Data Processing Addendum</span>
                </>
              }
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <PrimaryBtn full icon="→" onClick={handleSubmit}>Create Account</PrimaryBtn>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
            <span style={{ flex: 1, height: 1, background: T.line }} />
            <span style={{ fontSize: 11, color: T.mute2, fontFamily: T.mono, letterSpacing: 0.4 }}>OR CONTINUE WITH</span>
            <span style={{ flex: 1, height: 1, background: T.line }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <GhostBtn full>
              <svg width="14" height="14" viewBox="0 0 16 16" fill={T.ink}>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.7 7.7 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.74.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 008 0z" />
              </svg>
              GitHub
            </GhostBtn>
            <GhostBtn full>
              <svg width="14" height="14" viewBox="0 0 48 48">
                <path fill="#4285f4" d="M45 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.8 6.5-9.5 6.5-15.8z" />
                <path fill="#34a853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.2v5.7C7.8 41.2 15.3 46 24 46z" />
                <path fill="#fbbc04" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.2C2.8 17.2 2 20.5 2 24s.8 6.8 2.2 9.8l7.4-5.7z" />
                <path fill="#ea4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.4l6.3-6.3C35 4.7 30 2 24 2 15.3 2 7.8 6.8 4.2 14.2l7.4 5.7C13.3 14.7 18.2 10.8 24 10.8z" />
              </svg>
              Google
            </GhostBtn>
          </div>

          <p style={{ fontSize: 11.5, color: T.mute, textAlign: 'center', marginTop: 24, marginBottom: 0, fontFamily: T.sans }}>
            Already have an account?{' '}
            <span style={{ color: T.navy, fontWeight: 500, cursor: 'pointer' }}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
}
