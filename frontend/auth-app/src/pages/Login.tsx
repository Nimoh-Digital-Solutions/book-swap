import { Mail, Lock, ArrowRight, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  return (
    <AuthLayout>
      <div className="text-left">
        <h2 className="text-4xl font-bold text-brand-deep mb-2">Welcome Back</h2>
        <p className="text-slate-600">Sign in to your fellowship account to continue.</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-deep mb-1.5 ml-1" htmlFor="email">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-deep">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-deep focus:border-transparent transition-all outline-none rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-sm font-semibold text-brand-deep" htmlFor="password">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-brand-deep/70 hover:text-brand-deep transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-deep">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-deep focus:border-transparent transition-all outline-none rounded-lg"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-lg text-white font-bold bg-brand-deep hover:opacity-90 active:scale-[0.98] transition-all text-lg shadow-lg shadow-brand-deep/20 cursor-pointer"
        >
          Sign In
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-bg-light text-slate-500 font-medium uppercase tracking-widest text-[10px]">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg cursor-pointer">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm font-semibold">Google</span>
        </button>
        <button className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-lg cursor-pointer">
          <Wand2 className="w-5 h-5 text-brand-deep" />
          <span className="text-sm font-semibold">Magic Link</span>
        </button>
      </div>

      <p className="text-center text-slate-600 font-medium">
        New to Vineyard?{' '}
        <Link
          to="/register"
          className="text-brand-deep font-bold hover:underline decoration-brand-deep decoration-2 underline-offset-4"
        >
          Create an account
        </Link>
      </p>

      <div className="pt-10 flex justify-center gap-6">
        <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Privacy Policy
        </a>
        <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Terms of Service
        </a>
        <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
          Help Center
        </a>
      </div>
    </AuthLayout>
  );
}
