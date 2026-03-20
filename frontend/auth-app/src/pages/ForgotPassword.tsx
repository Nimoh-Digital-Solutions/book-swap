import { Mail, ArrowLeft, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-bg-light">
      {/* Left Side: Form Container */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24 xl:px-32">
        <div className="mx-auto w-full max-w-md">
          {/* Logo/Header */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-deep text-white">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-brand-deep uppercase">Vineyard Group</h1>
          </div>

          {/* Reset Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Forgot Password?</h2>
              <p className="text-slate-600">
                Enter your email and we'll send you instructions to reset your password.
              </p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="block w-full rounded border-slate-200 bg-white py-3 pl-10 text-slate-900 placeholder:text-slate-400 focus:border-brand-deep focus:ring-1 focus:ring-brand-deep"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-lg text-white font-bold bg-brand-deep hover:opacity-90 active:scale-[0.98] transition-all text-lg shadow-lg shadow-brand-deep/20 cursor-pointer"
              >
                Send Reset Link
              </button>
            </form>

            <div className="text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-deep hover:text-brand-deep/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Small Text */}
        <div className="mt-20 text-center lg:text-left">
          <p className="text-xs text-slate-500">
            © 2024 Vineyard Group Fellowship. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side: Brand Image/Graphic */}
      <div className="relative hidden w-1/2 lg:block bg-brand-deep">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-brand-deep to-[#2d1f4d]">
          {/* Abstract Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-20 bg-cover" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCb8iEEzQk_Bq3uYne-dy56oxGSgXxmYLohqwNciWDV3crfQn3Mh32GDoK2eKlZGX-2285G-HQ8QOqrYIgppmYAdR71o8FvqHBB9oPW7xlaucl8hcgmPQIp4SL4oMVxy5NacM_AmVw83WKnicDb2L9rRI9uz7HnlUwKfI4Z2LKOtNpjX_yY0ilY7KRT-nf6xvhC_bHIS8nDH62cH8ntmi1T-YBRsuFnIgSRMdMW11oQYD-7_MNOHz184Qb9e9idvmXl2VtarLqoYa4')" }}
          ></div>
          
          <div className="relative z-10 space-y-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 border-2 border-white text-white">
              <LockKeyhole className="w-12 h-12" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tight text-white leading-tight">
                Recover Your <span className="text-white">Account</span>
              </h2>
              <p className="mx-auto max-w-md text-xl text-slate-300 leading-relaxed">
                We'll help you get back to your community. Your fellowship is just a few clicks away.
              </p>
            </div>

            <div className="pt-8">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw-TsRhge8jPY30VfGmHhB5I92lv0rw-Bv0-55iPQWdexqhtzCd-Cn4QIH4Mfhkk_pEHrShE-IjhfcVPqHk9niEXsDpnOSlbGa4K_4lOn2V2YzaVLMjADG0-TxCCAZFpcXq65t_qS3E_aIB8y9VcRxjsUqQetmtkuGa_lzPMHJgFNPUS2f6sf9MFdnQeQvH-56kSZqkZXwFNONgUrxnEw0R6ZfolBJI66TBBGnAFjPHG2ypRYuC7NUWetJn6--fzNmUxrtDgV61w8"
                alt="Community gathering"
                className="mx-auto h-64 w-full max-w-lg rounded-lg object-cover shadow-2xl border border-white/10"
              />
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-10 left-10 flex gap-2">
            <div className="h-1 w-12 rounded-full bg-white"></div>
            <div className="h-1 w-4 rounded-full bg-white/30"></div>
            <div className="h-1 w-4 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
