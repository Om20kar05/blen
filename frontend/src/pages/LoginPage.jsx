import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Briefcase, UserCheck, AlertCircle } from 'lucide-react';
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

  const handleQuickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setErrorMessage('');
    // Auto-login for interviewer convenience
    setTimeout(async () => {
      try {
        setIsLoading(true);
        const loggedInUser = await login(testEmail, testPassword);
        toast.success(`Logged in as ${loggedInUser.role.toUpperCase()}: ${loggedInUser.name}`);
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
              label="Email Address"
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
              className="w-full mt-2 font-bold"
              isLoading={isLoading}
            >
              Sign In to Workspace
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Create / Register an Account
            </Link>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Evaluator Test Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@blen.com', 'Admin@123')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 transition-colors text-purple-900 group cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 mb-1" />
                <span className="text-xs font-bold">Admin</span>
                <span className="text-[10px] text-purple-600 font-medium">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@blen.com', 'Manager@123')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 transition-colors text-blue-900 group cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-xs font-bold">Manager</span>
                <span className="text-[10px] text-blue-600 font-medium">Team Scope</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee@blen.com', 'Employee@123')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 transition-colors text-emerald-900 group cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs font-bold">Employee</span>
                <span className="text-[10px] text-emerald-600 font-medium">Self Service</span>
              </button>
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
