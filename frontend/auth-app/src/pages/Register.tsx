import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [role, setRole] = useState<'seeker' | 'leader'>('seeker');

  return (
    <AuthLayout
      reverse={true}
      title="A community that grows with you."
      subtitle="Find local groups, share prayer requests, and stay connected all week long."
    >
      <div className="text-left">
        <h2 className="text-4xl font-extrabold text-brand-deep mb-2 tracking-tight">
          Join the Fellowship
        </h2>
        <p className="text-slate-600">Start your journey toward deeper community today.</p>
      </div>

      {/* Role Toggle */}
      <div className="flex p-1.5 bg-white border border-slate-200 shadow-sm rounded-lg">
        <label className="flex-1 relative cursor-pointer group">
          <input
            type="radio"
            name="role"
            value="seeker"
            checked={role === 'seeker'}
            onChange={() => setRole('seeker')}
            className="peer sr-only"
          />
          <div className="flex items-center justify-center h-10 text-xs font-bold transition-all peer-checked:bg-brand-deep peer-checked:text-white text-slate-500 rounded-md">
            Looking for a group
          </div>
        </label>
        <label className="flex-1 relative cursor-pointer group">
          <input
            type="radio"
            name="role"
            value="leader"
            checked={role === 'leader'}
            onChange={() => setRole('leader')}
            className="peer sr-only"
          />
          <div className="flex items-center justify-center h-10 text-xs font-bold transition-all peer-checked:bg-brand-deep peer-checked:text-white text-slate-500 rounded-md">
            Want to lead
          </div>
        </label>
      </div>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-deep mb-1.5 ml-1" htmlFor="name">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-deep">
                <User className="w-5 h-5" />
              </div>
              <input
                id="name"
                type="text"
                required
                placeholder="John Doe"
                className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-deep focus:border-transparent transition-all outline-none rounded-lg"
              />
            </div>
          </div>

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

          {role === 'leader' && (
             <div>
             <label className="block text-sm font-semibold text-brand-deep mb-1.5 ml-1" htmlFor="group-name">
               Small Group Name (Optional)
             </label>
             <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-deep">
                 <Users className="w-5 h-5" />
               </div>
               <input
                 id="group-name"
                 type="text"
                 placeholder="e.g. Downtown Young Adults"
                 className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:ring-2 focus:ring-brand-deep focus:border-transparent transition-all outline-none rounded-lg"
               />
             </div>
           </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-brand-deep mb-1.5 ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-deep">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
          Create Account
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <p className="text-center text-slate-600 font-medium pt-4">
        Already have an account?{' '}
        <Link
          to="/"
          className="text-brand-deep font-bold hover:underline decoration-brand-deep decoration-2 underline-offset-4"
        >
          Sign In
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
