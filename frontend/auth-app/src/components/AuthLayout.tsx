import React from 'react';
import { Leaf } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc?: string;
  title?: string;
  subtitle?: string;
  showTestimonial?: boolean;
  reverse?: boolean; // If true, image is on the right (like Register page)
}

export default function AuthLayout({
  children,
  imageSrc = "https://lh3.googleusercontent.com/aida-public/AB6AXuDvvWUHYjcKDwFbGOAI1h2P1LA9yy0D4JKuCJmwB6HBvVUT-aVS0nWPl9dU2c3jBCsJ2w-O-2VRiS5QI3TyZI1B-j_shzGy60Boyd8ebiYOpKZlt7DT8OtbSSA3pLltLLRlzW5DXggUFdJOJuEMlUEXks-Fz5PpdQEqBjShcu33hKlxCbisyBOnxWGk7YaMMoAZej0mzzt3wZCfwRess4gsnq8HclxCRLcIzWF5e2uvYuKXOOPpE-g4iEbJkywqrcM3aSfQD_F7Szk",
  title = "Growing together in faith and fellowship.",
  subtitle = "Join our community of believers as we cultivate spiritual growth and meaningful connections in our local fellowship groups.",
  showTestimonial = true,
  reverse = false,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Content Side */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-16 bg-bg-light ${reverse ? 'order-1' : 'order-2'}`}>
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
          
          {children}
        </div>
      </div>

      {/* Visual Side */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-deep items-center justify-center p-12 ${reverse ? 'order-2' : 'order-1'}`}>
        <div 
          className="absolute inset-0 z-0 opacity-40 mix-blend-overlay bg-cover bg-center" 
          style={{ backgroundImage: `url('${imageSrc}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-deep via-brand-deep/80 to-transparent z-10"></div>
        
        <div className="relative z-20 max-w-lg text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-brand-lime p-2 text-brand-deep rounded-lg">
              <Leaf className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Vineyard Group</h1>
          </div>
          
          <h2 className="text-5xl font-bold leading-tight mb-6">{title}</h2>
          <p className="text-xl text-slate-300 leading-relaxed">{subtitle}</p>
          
          {showTestimonial && (
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuAnqIlHIhHKDEY_Hs-BIcY_-V12oNz9y3Q1OatbgBJKZmrASBsJA8lKV3s6kE2v-elYju-Iq3aLcRNQuFdvJ5lASyrVtoG7A6mN_lGJap_ogcWMqnhdNJfHXj0syUqCdJ7s7IKlYYzi_ied4nGHRVa7m2ymsL5fxayiCX9HJERYgcDeiAMRHyIQ65_AM6I8LQiuzxoglLCNkd3-hhW9InuLLdDiCJMtHi7m4eb8RE6A531g16mD3NrxDP2g-0awkzQAgvJMvsK3xJA',
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuCBMqCZy5zxorCapkLqog4HgPFmZ8EaCVAlqX8MBr4yO2uq5OyEiDQfl6_GMqGtpM__I-bg_bJXBvhPsbwuRDFhLJwksRLX4Jgv9kiyN4vU9d8LV9lV6q-tGrAcndFjpGzS8YYrqq59WHJI9VMRg5H41YQa3N2XzWUFrLg9q1IkgTJeQw88jl4PfwUSe0BmDkXZjjIiM3zaVyrjH0K-v-eHJXuA7K0jlhlf_drb_9zS3KsvFaFGA2dY5016J4CB3WYrVwE6ZGl8xNw',
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBQHsIptsiaV6P4n7UOx0K43EC4HnYL4ok5HN1A4gRf8JhM-x5oC88ZuvqxJHwcgOMWis1dOLG2XTpZH2STt7JH1QxhSngsbObahc5QDZ898LZamhALrWcHhv9VkWBm0GOYeRjQEDhGoyWFa_1gJl-MiqLHxxKaO99CnnCrKNJYeafdyqhJosrMsC-xktYKG-BfXZ6nQYHI-XIeOfzWnBHfN0lPhNV03R5gTgKMpQTHMQUwRhpmEXMvs4GbNgcvIyRudW26a7i-OgI'
                ].map((src, i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-brand-deep bg-cover bg-center"
                    style={{ backgroundImage: `url('${src}')` }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-400">+500 members joined this month</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
