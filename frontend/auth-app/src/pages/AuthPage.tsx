import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { FloatingPaths } from '../components/ui/background-paths';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Sync state with URL
  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location.pathname]);

  const toggleAuth = () => {
    const newState = !isLogin;
    setIsLogin(newState);
    // Update URL without full reload
    navigate(newState ? '/' : '/register', { replace: true });
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-bg-light">
      {/* Image Panel */}
      <motion.div
        layout
        className={`hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-deep items-center justify-center p-12 ${
          isLogin ? 'order-1' : 'order-2'
        }`}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Animated Background Paths */}
        <div className="absolute inset-0 opacity-40">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-deep via-brand-deep/80 to-transparent z-10 pointer-events-none"></div>

        <div className="relative z-20 max-w-lg text-white">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-brand-lime p-2 text-brand-deep rounded-lg">
                    <Leaf className="w-6 h-6 fill-current" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">Vineyard Group</h1>
                </div>

                <h2 className="text-5xl font-bold leading-tight mb-6">
                  Growing together in faith and fellowship.
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Join our community of believers as we cultivate spiritual growth and meaningful
                  connections in our local fellowship groups.
                </p>

                <div className="mt-12 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnqIlHIhHKDEY_Hs-BIcY_-V12oNz9y3Q1OatbgBJKZmrASBsJA8lKV3s6kE2v-elYju-Iq3aLcRNQuFdvJ5lASyrVtoG7A6mN_lGJap_ogcWMqnhdNJfHXj0syUqCdJ7s7IKlYYzi_ied4nGHRVa7m2ymsL5fxayiCX9HJERYgcDeiAMRHyIQ65_AM6I8LQiuzxoglLCNkd3-hhW9InuLLdDiCJMtHi7m4eb8RE6A531g16mD3NrxDP2g-0awkzQAgvJMvsK3xJA',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBMqCZy5zxorCapkLqog4HgPFmZ8EaCVAlqX8MBr4yO2uq5OyEiDQfl6_GMqGtpM__I-bg_bJXBvhPsbwuRDFhLJwksRLX4Jgv9kiyN4vU9d8LV9lV6q-tGrAcndFjpGzS8YYrqq59WHJI9VMRg5H41YQa3N2XzWUFrLg9q1IkgTJeQw88jl4PfwUSe0BmDkXZjjIiM3zaVyrjH0K-v-eHJXuA7K0jlhlf_drb_9zS3KsvFaFGA2dY5016J4CB3WYrVwE6ZGl8xNw',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQHsIptsiaV6P4n7UOx0K43EC4HnYL4ok5HN1A4gRf8JhM-x5oC88ZuvqxJHwcgOMWis1dOLG2XTpZH2STt7JH1QxhSngsbObahc5QDZ898LZamhALrWcHhv9VkWBm0GOYeRjQEDhGoyWFa_1gJl-MiqLHxxKaO99CnnCrKNJYeafdyqhJosrMsC-xktYKG-BfXZ6nQYHI-XIeOfzWnBHfN0lPhNV03R5gTgKMpQTHMQUwRhpmEXMvs4GbNgcvIyRudW26a7i-OgI',
                    ].map((src, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-brand-deep bg-cover bg-center"
                        style={{ backgroundImage: `url('${src}')` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-400">
                    +500 members joined this month
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-10">
                  <div className="bg-brand-lime p-2.5 rounded-lg text-brand-deep">
                    <Leaf className="w-6 h-6 fill-current" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">Vineyard Group</h1>
                </div>

                <h2 className="text-5xl font-extrabold leading-tight mb-6">
                  A community that grows with you.
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed font-medium">
                  Find local groups, share prayer requests, and stay connected all week long.
                </p>

                <div className="mt-16 flex items-center gap-5 p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                  <div className="flex -space-x-3">
                    {[
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnqIlHIhHKDEY_Hs-BIcY_-V12oNz9y3Q1OatbgBJKZmrASBsJA8lKV3s6kE2v-elYju-Iq3aLcRNQuFdvJ5lASyrVtoG7A6mN_lGJap_ogcWMqnhdNJfHXj0syUqCdJ7s7IKlYYzi_ied4nGHRVa7m2ymsL5fxayiCX9HJERYgcDeiAMRHyIQ65_AM6I8LQiuzxoglLCNkd3-hhW9InuLLdDiCJMtHi7m4eb8RE6A531g16mD3NrxDP2g-0awkzQAgvJMvsK3xJA',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBMqCZy5zxorCapkLqog4HgPFmZ8EaCVAlqX8MBr4yO2uq5OyEiDQfl6_GMqGtpM__I-bg_bJXBvhPsbwuRDFhLJwksRLX4Jgv9kiyN4vU9d8LV9lV6q-tGrAcndFjpGzS8YYrqq59WHJI9VMRg5H41YQa3N2XzWUFrLg9q1IkgTJeQw88jl4PfwUSe0BmDkXZjjIiM3zaVyrjH0K-v-eHJXuA7K0jlhlf_drb_9zS3KsvFaFGA2dY5016J4CB3WYrVwE6ZGl8xNw',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBQHsIptsiaV6P4n7UOx0K43EC4HnYL4ok5HN1A4gRf8JhM-x5oC88ZuvqxJHwcgOMWis1dOLG2XTpZH2STt7JH1QxhSngsbObahc5QDZ898LZamhALrWcHhv9VkWBm0GOYeRjQEDhGoyWFa_1gJl-MiqLHxxKaO99CnnCrKNJYeafdyqhJosrMsC-xktYKG-BfXZ6nQYHI-XIeOfzWnBHfN0lPhNV03R5gTgKMpQTHMQUwRhpmEXMvs4GbNgcvIyRudW26a7i-OgI',
                    ].map((src, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-full border-2 bg-cover bg-center border-brand-deep"
                        style={{ backgroundImage: `url('${src}')` }}
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-lime">+500 members</p>
                    <p className="text-xs text-slate-400">Joined our fellowship this month</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Form Panel */}
      <motion.div
        layout
        className={`w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-16 bg-bg-light ${
          isLogin ? 'order-2' : 'order-1'
        }`}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-brand-deep p-2 rounded-lg text-brand-lime">
                <Leaf className="w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-bold text-brand-deep">Vineyard</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm onToggle={toggleAuth} />
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm onToggle={toggleAuth} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
