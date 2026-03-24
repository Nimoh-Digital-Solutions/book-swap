import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useNearbyCount } from '@features/discovery';
import { useDocumentTitle, useUserCity } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Clock,
  Search,
  Star,
} from 'lucide-react';

const DEFAULT_RADIUS = 10000; // 10 km

const POPULAR_TAGS = ['Sci-Fi', 'Dutch Literature', 'Cookbooks', 'Biographies'];

const BOOKS = [
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fantasy',
    time: '5h 20m',
    available: true,
    owner: { initial: 'S', name: 'Sarah J.' },
    cover: 'bg-gradient-to-b from-[#1A2B4C] to-[#0D1526]',
  },
  {
    title: 'Cloud Cuckoo Land',
    author: 'Anthony Doerr',
    genre: 'Hist. Fiction',
    time: '12h 15m',
    available: false,
    owner: { initial: 'M', name: 'Mark T.' },
    cover: 'bg-gradient-to-b from-[#7FB5D5] to-[#A3CBE3]',
  },
  {
    title: 'The Seven Husbands...',
    author: 'Taylor Jenkins Reid',
    genre: 'Romance',
    time: '8h 45m',
    available: false,
    owner: { initial: 'E', name: 'Elena R.' },
    cover: 'bg-[#1E4D4F]',
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Sci-Fi',
    time: '10h 30m',
    available: false,
    owner: { initial: 'D', name: 'David K.' },
    cover: 'bg-gradient-to-b from-[#0F2B2F] to-[#0A1A1C]',
  },
];

const STEPS = [
  {
    icon: BookOpen,
    title: 'List Your Books',
    description:
      "Scan your book's barcode or type the title. We'll automatically fetch the details and cover art for you.",
  },
  {
    icon: Search,
    title: 'Find & Request',
    description:
      'Browse the local map for books nearby. Request a swap or offer a credit for titles you love.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Swap Locally',
    description:
      'Meet up at a safe, public spot or use one of our verified BookDrop locations in the city.',
  },
];

const HomePage = (): ReactElement => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { city, lat, lng, loading: cityLoading } = useUserCity();

  useDocumentTitle(routeMetadata[PATHS.HOME].title);

  const { data: nearbyData } = useNearbyCount(lat, lng, DEFAULT_RADIUS);

  const handleSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    void navigate(`${PATHS.CATALOGUE}?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-[#152018] text-[#8C9C92] font-sans selection:bg-[#E4B643] selection:text-[#152018]">
      {/* ── Hero Section ── */}
      <section className="relative">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E4B643]/10 blur-[120px] rounded-full" />
          <div
            className="absolute inset-0 opacity-10 bg-center bg-no-repeat bg-cover"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2000&auto=format&fit=crop")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#152018]/80 to-[#152018]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center" style={{ marginInline: 'auto' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A251D] border border-[#28382D] text-[#E4B643] text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-[#E4B643] animate-pulse" />
            {cityLoading || !nearbyData ? (
              <span
                className="inline-block w-44 h-3 bg-[#28382D] rounded-full animate-pulse"
                aria-hidden="true"
              />
            ) : nearbyData.user_count === 0 ? (
              `Be the first swapper in ${city}!`
            ) : (
              `${nearbyData.user_count.toLocaleString()} Active Swappers in ${city}`
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
            {t('home.hero.titlePart1', 'Find your next')} <br />
            <span className="text-[#E4B643]">
              {t('home.hero.titlePart2', 'great adventure.')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#8C9C92] mb-10 max-w-2xl mx-auto">
            {t(
              'home.hero.subtitle',
              'Search thousands of books available for trade in your local neighborhood.',
            )}
          </p>

          {/* Search Bar */}
          <form
            className="max-w-2xl mx-auto relative mb-6"
            onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
          >
            <div className="flex items-center bg-[#1A251D] border border-[#28382D] rounded-full p-2 pl-6 shadow-2xl focus-within:border-[#E4B643]/50 transition-colors">
              <Search className="w-5 h-5 text-[#8C9C92]" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.hero.searchPlaceholder', 'Search by title, author, or ISBN...')}
                className="flex-1 bg-transparent border-none outline-none text-white px-4 placeholder-[#5A6A60]"
                aria-label={t('home.hero.searchLabel', 'Search books')}
              />
              <button
                type="submit"
                className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-8 py-3 rounded-full font-bold transition-colors"
              >
                {t('home.hero.search', 'Search')}
              </button>
            </div>
          </form>

          {/* Popular Tags */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="text-[#5A6A60] font-medium mr-2">
              {t('home.hero.popularNow', 'Popular now:')}
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSearch(tag)}
                className="px-4 py-1.5 rounded-full bg-[#1A251D] border border-[#28382D] hover:border-[#E4B643]/50 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently Added Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ marginInline: 'auto' }}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('home.recentlyAdded.title', 'Recently Added')}
            </h2>
            <p className="text-[#8C9C92]">
              {t('home.recentlyAdded.subtitle', 'Fresh arrivals from the community library.')}
            </p>
          </div>
          <Link
            to={PATHS.HOME}
            className="text-[#E4B643] font-semibold text-sm hover:text-white transition-colors flex items-center gap-1 no-underline"
          >
            {t('home.recentlyAdded.viewAll', 'View all books')}{' '}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BOOKS.map((book) => (
            <div
              key={book.title}
              className="bg-[#1A251D] rounded-2xl p-4 border border-[#28382D] group hover:border-[#E4B643]/30 transition-colors"
            >
              <div className="bg-[#E8ECE9] rounded-xl p-4 flex justify-center items-center mb-4 h-64 relative">
                {book.available && (
                  <div className="absolute top-3 right-3 bg-[#E4B643] text-[#152018] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-10">
                    {t('home.book.available', 'Available')}
                  </div>
                )}
                <div
                  className={`w-36 h-52 shadow-xl rounded-sm overflow-hidden ${book.cover} flex flex-col items-center justify-center p-4 text-center border-l-4 border-white/20`}
                >
                  <h3 className="text-white/90 font-serif text-sm tracking-widest uppercase mb-1">
                    {book.title}
                  </h3>
                  <p className="text-white/50 text-[8px] uppercase tracking-widest">
                    {book.author}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#E4B643] text-[10px] font-bold uppercase tracking-wider">
                  {book.genre}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#5A6A60]">
                  <Clock className="w-3 h-3" /> {book.time}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight mb-1">
                {book.title}
              </h3>
              <p className="text-sm text-[#8C9C92] mb-4">{book.author}</p>
              <div className="flex items-center justify-between pt-4 border-t border-[#28382D]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {book.owner.initial}
                  </div>
                  <span className="text-xs text-white">{book.owner.name}</span>
                </div>
                <button
                  className="text-[#E4B643] hover:text-white transition-colors"
                  aria-label={t('home.book.swap', 'Swap {{title}}', { title: book.title })}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works & Community Section ── */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        style={{ marginInline: 'auto' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: How it Works */}
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-4">
              {t('home.howItWorks.title', 'How it Works')}
            </h2>
            <p className="text-[#8C9C92] mb-10">
              {t(
                'home.howItWorks.subtitle',
                'Start your reading journey in three simple steps.',
              )}
            </p>

            <div className="relative">
              <div
                className="absolute left-[15px] top-8 bottom-8 w-px bg-[#28382D]"
                aria-hidden="true"
              />
              <div className="space-y-8">
                {STEPS.map((step, i) => (
                  <div key={step.title} className="flex gap-6 relative">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#152018] border border-[#E4B643] text-[#E4B643] flex items-center justify-center font-bold text-sm z-10">
                      {i + 1}
                    </div>
                    <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-6 flex-1">
                      <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <step.icon className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
                        {step.title}
                      </h4>
                      <p className="text-[#8C9C92] text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Community */}
          <div
            id="community"
            className="bg-[#1A251D] rounded-3xl p-8 border border-[#28382D] relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="text-center mb-10">
                <span className="text-[#E4B643] text-[10px] font-bold uppercase tracking-widest mb-2 block">
                  {t('home.community.label', 'Live Community')}
                </span>
                <h3 className="text-3xl font-extrabold text-white">
                  {t('home.community.title', 'Connect with Amsterdam')}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#152018] rounded-2xl p-6 text-center border border-[#28382D]">
                  <div className="text-3xl font-bold text-[#E4B643] mb-1">
                    {nearbyData ? nearbyData.count.toLocaleString() : '—'}
                  </div>
                  <div className="text-[10px] font-bold text-[#5A6A60] uppercase tracking-wider">
                    {t('home.community.booksAvailable', 'Books Available')}
                  </div>
                </div>
                <div className="bg-[#152018] rounded-2xl p-6 text-center border border-[#28382D]">
                  <div className="text-3xl font-bold text-[#E4B643] mb-1">852</div>
                  <div className="text-[10px] font-bold text-[#5A6A60] uppercase tracking-wider">
                    {t('home.community.swapsThisWeek', 'Swaps This Week')}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#152018] border border-[#28382D]">
                  <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-[#8C9C92]">
                    <span className="text-[#E4B643] font-bold">Emma</span> listed Dune in De Pijp.
                  </p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#152018] border border-[#28382D]">
                  <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-[#8C9C92]">
                    <span className="text-[#E4B643] font-bold">Liam</span> &{' '}
                    <span className="text-[#E4B643] font-bold">Noah</span> just swapped books!
                  </p>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#152018] border border-[#28382D]">
                  <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-[#8C9C92]">
                    New BookDrop location added in Jordaan.
                  </p>
                </div>
              </div>

              <button className="w-full py-4 rounded-xl border border-[#28382D] text-[#E4B643] font-bold text-sm uppercase tracking-wider hover:bg-[#28382D]/50 transition-colors">
                {t('home.community.viewMap', 'View Full Map')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-8" style={{ marginInline: 'auto' }}>
        <div className="bg-[#E4B643] rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#152018] mb-4">
              {t('home.cta.title', 'Ready to clear your shelves?')}
            </h2>
            <p className="text-[#152018]/80 text-lg font-medium">
              {t(
                'home.cta.subtitle',
                'Join 15,000+ book lovers in Amsterdam and start trading today.',
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to={PATHS.REGISTER}
              className="bg-[#152018] hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-colors whitespace-nowrap text-center no-underline"
            >
              {t('home.cta.createAccount', 'Create Free Account')}
            </Link>
            <a
              href="#how-it-works"
              className="bg-transparent border border-[#152018]/30 text-[#152018] hover:bg-[#152018]/10 px-8 py-4 rounded-full font-bold transition-colors whitespace-nowrap text-center no-underline"
            >
              {t('home.cta.learnMore', 'Learn More')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
