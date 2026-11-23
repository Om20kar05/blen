import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const loggedInUser = await login(email, password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct one-click login enabled strictly for Admin evaluator convenience
  const handleAdminDirectLogin = () => {
    setEmail('admin@blen.com');
    setPassword('Admin@123');
    setErrorMessage('');
    setTimeout(async () => {
      try {
        setIsLoading(true);
        const loggedInUser = await login('admin@blen.com', 'Admin@123');
        toast.success(`Logged in as Administrator: ${loggedInUser.name}`);
        navigate('/dashboard');
      } catch (err) {
        setErrorMessage(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-brand-500/30">
          B
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          BLEN DIGITAL
        </h2>
        <p className="mt-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Employee Leave & Attendance Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              required
              placeholder="name@blen.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Evaluator Access - Enabled ONLY for Admin */}
          <div className="mt-7 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Evaluator Access (Admin Only)
            </p>

            <button
              type="button"
              onClick={handleAdminDirectLogin}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/90 transition-all text-purple-900 group cursor-pointer shadow-sm hover:shadow"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  Direct Login as Administrator
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                    Instant
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  admin@blen.com • Full admin privileges & controls
                </span>
              </div>
            </button>

            {/* Note on Manager & Employee Accounts */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-700">Manager & Employee Accounts:</span>{' '}
                  All staff accounts are created by the Administrator inside the dashboard. To sign in as an employee or manager, enter their assigned credentials in the form above.
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between items-center px-1">
                <span>Default Manager: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">manager@blen.com</code></span>
                <span>PW: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">Manager@123</code></span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 flex justify-between items-center px-1">
                <span>Default Employee: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">employee@blen.com</code></span>
                <span>PW: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">Employee@123</code></span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          BLEN DIGITAL Assessment Machine Test • Built with MERN Stack & RBAC
        </p>
      </div>
    </div>
  );
};
