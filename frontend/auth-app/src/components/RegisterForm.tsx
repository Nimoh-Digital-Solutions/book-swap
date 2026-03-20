import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RegisterFormProps {
  onToggle: () => void;
}

export default function RegisterForm({ onToggle }: RegisterFormProps) {
  const [role, setRole] = useState<'seeker' | 'leader'>('seeker');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md space-y-8"
    >
      <div className="text-left">
        <h2 className="text-4xl font-extrabold text-brand-deep mb-2 tracking-tight">
          Join the Fellowship
        </h2>
        <p className="text-slate-600">Start your journey toward deeper community today.</p>
      </div>

      {/* Role Toggle */}
      <div className="flex p-1.5 bg-white border border-slate-200 shadow-sm rounded-lg relative">
        <button
          onClick={() => setRole('seeker')}
          className={`flex-1 relative flex items-center justify-center h-10 text-xs font-bold transition-colors z-10 rounded-md ${
            role === 'seeker' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {role === 'seeker' && (
            <motion.div
              layoutId="activeRole"
              className="absolute inset-0 bg-brand-deep rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Looking for a group</span>
        </button>
        <button
          onClick={() => setRole('leader')}
          className={`flex-1 relative flex items-center justify-center h-10 text-xs font-bold transition-colors z-10 rounded-md ${
            role === 'leader' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {role === 'leader' && (
            <motion.div
              layoutId="activeRole"
              className="absolute inset-0 bg-brand-deep rounded-md shadow-sm"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Want to lead</span>
        </button>
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

          <AnimatePresence initial={false}>
            {role === 'leader' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

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
        <button
          onClick={onToggle}
          className="text-brand-deep font-bold hover:underline decoration-brand-deep decoration-2 underline-offset-4 cursor-pointer"
        >
          Sign In
        </button>
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
    </motion.div>
  );
}
