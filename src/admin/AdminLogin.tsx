/**
 * 店员登录页
 */

import React, { useState } from 'react';
import { staffLogin } from '../api/admin';
import { DEFAULTS } from '../data';
import { Lock, LogIn } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await staffLogin(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10143A] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-[#FDD772]/30">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 mx-auto rounded-xl bg-black object-contain" />
          <h1 className="font-serif text-xl font-bold text-stone-900 mt-4">
            {DEFAULTS.CLINIC_NAME} · 店员后台
          </h1>
          <p className="text-xs text-stone-500 mt-1">仅限店内员工使用 · 登录有效 24 小时</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-stone-500 font-medium">账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 font-medium">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FDD772] hover:bg-[#E8C050] text-[#10143A] font-bold py-3 rounded-xl disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? '登录中…' : '登录后台'}
          </button>
        </form>

        <p className="text-[10px] text-stone-400 text-center mt-6 flex items-center justify-center gap-1">
          <Lock size={10} />
          密码请在服务器 .env.local 中配置 STAFF_PASSWORD
        </p>
        <a href="/" className="block text-center text-xs text-[#10143A] mt-3 hover:underline">
          ← 返回官网首页
        </a>
      </div>
    </div>
  );
};
