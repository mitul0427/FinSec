import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  ShieldAlert,
  Settings,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Read mock user if present in local state
  const mockUserStr = localStorage.getItem('finsec_mock_user');
  const effectiveUser = user || (mockUserStr ? JSON.parse(mockUserStr) : null);
  const isAdmin = effectiveUser?.role === 'ADMIN' || effectiveUser?.email?.includes('admin');

  const handleLogout = async () => {
    localStorage.removeItem('finsec_access_token');
    localStorage.removeItem('finsec_mock_user');
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    // "SOC Threat Map" goes to /admin
    { name: 'SOC Threat Map', path: '/admin', icon: ShieldAlert, adminOnly: false },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shrink-0 min-h-screen">
      <div className="space-y-8">
        {/* User Profile Info Header */}
        <div className="flex flex-col items-center text-center pt-2 space-y-3">
          <div className="relative">
            <img
              src={
                effectiveUser?.avatar ||
                (isAdmin
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256')
              }
              alt="User Profile"
              className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md"
            />
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 border-2 border-white rounded-full flex items-center justify-center ${
                isAdmin ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-white" />
            </span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {effectiveUser?.fullName || (isAdmin ? 'Chief Security Officer' : 'Gadiel Machado')}
            </h3>
            <p className="text-xs font-semibold text-slate-400 capitalize">
              {isAdmin ? 'SOC Admin / Cyber Lead' : 'Designer / User'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? item.path === '/admin'
                        ? 'bg-rose-50 text-rose-600 shadow-sm font-bold'
                        : 'bg-indigo-50 text-indigo-600 shadow-sm font-bold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
                {item.path === '/admin' && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                    SOC
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="pt-6 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
