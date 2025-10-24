'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, callbackUrl, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Ungültige Zugangsdaten');
      return;
    }
    if (res?.ok) {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(transparent_1px,rgba(0,0,0,0.03)_1px)] [background-size:16px_16px]" />
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-xl">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Admin Anmeldung</h1>
          <p className="text-sm text-gray-600 mt-1">Bitte melden Sie sich an, um das Dashboard zu betreten.</p>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--admin-sidebar-bg)] focus:border-[var(--admin-sidebar-bg)]"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--admin-sidebar-bg)] hover:bg-[var(--admin-sidebar-hover)] disabled:opacity-60 text-white px-4 py-2 rounded-md border border-white/10 shadow-sm transition-colors duration-200"
            >
              {loading ? 'Anmelden…' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
