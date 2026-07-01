/**
 * 店员后台入口 /admin
 */

import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { staffVerifySession } from '../api/admin';

export const AdminApp: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    staffVerifySession().then((ok) => {
      setAuthed(ok);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#10143A] flex items-center justify-center text-white/70 text-sm">
        验证登录状态…
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return <AdminDashboard onLogout={() => setAuthed(false)} />;
};
