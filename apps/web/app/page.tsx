'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { useTranslation, useLocale } from '../contexts/locale-context';
import {
  Zap, GitBranch, Users,
  ArrowRight, Database, Cpu, Layers,
  Workflow, Sparkles, Rocket, Lock, TrendingUp, Globe
} from 'lucide-react';

const FEATURE_ICONS = [Zap, Cpu, Database, Users, TrendingUp, Lock];
const CAPABILITY_ICONS = [Workflow, Zap, GitBranch, Layers, Sparkles, Rocket];

const FEATURES = [
  { title: 'landing.features.workflow.title', desc: 'landing.features.workflow.desc' },
  { title: 'landing.features.multiModel.title', desc: 'landing.features.multiModel.desc' },
  { title: 'landing.features.rag.title', desc: 'landing.features.rag.desc' },
  { title: 'landing.features.humanReview.title', desc: 'landing.features.humanReview.desc' },
  { title: 'landing.features.analytics.title', desc: 'landing.features.analytics.desc' },
  { title: 'landing.features.security.title', desc: 'landing.features.security.desc' },
];

const CAPABILITIES = [
  { title: 'landing.capabilities.async', desc: 'landing.capabilities.asyncDesc' },
  { title: 'landing.capabilities.websocket', desc: 'landing.capabilities.websocketDesc' },
  { title: 'landing.capabilities.versionControl', desc: 'landing.capabilities.versionControlDesc' },
  { title: 'landing.capabilities.conditional', desc: 'landing.capabilities.conditionalDesc' },
  { title: 'landing.capabilities.context', desc: 'landing.capabilities.contextDesc' },
  { title: 'landing.capabilities.retry', desc: 'landing.capabilities.retryDesc' },
];

const CARD_COLORS = [
  { hex: '#00e5ff', glow: 'shadow-[0_0_80px_rgba(0,229,255,0.5)]', bg: 'bg-cyan-500/10', border: 'border-cyan-500/50' },
  { hex: '#ff4081', glow: 'shadow-[0_0_80px_rgba(255,64,129,0.5)]', bg: 'bg-pink-500/10', border: 'border-pink-500/50' },
  { hex: '#69f0ae', glow: 'shadow-[0_0_80px_rgba(105,240,174,0.5)]', bg: 'bg-green-500/10', border: 'border-green-500/50' },
  { hex: '#ffca28', glow: 'shadow-[0_0_80px_rgba(255,202,40,0.5)]', bg: 'bg-amber-500/10', border: 'border-amber-500/50' },
  { hex: '#ea80fc', glow: 'shadow-[0_0_80px_rgba(234,128,252,0.5)]', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
  { hex: '#40c4ff', glow: 'shadow-[0_0_80px_rgba(64,196,255,0.5)]', bg: 'bg-blue-500/10', border: 'border-blue-500/50' },
];

function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function GlitchBars() {
  const [bars, setBars] = useState<Array<{
    id: number;
    left: number;
    width: number;
    top: number;
    height: number;
    color: string;
    duration: number;
  }>>([]);
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeroVisible(scrollY < window.innerHeight * 0.6);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const colors = [
      'rgba(255,255,255,0.25)',
      'rgba(0,229,255,0.3)',
      'rgba(255,64,129,0.25)',
      'rgba(234,128,252,0.3)',
      'rgba(255,202,40,0.2)',
      'rgba(105,240,174,0.2)',
    ];
    let id = 0;

    const createBar = () => {
      const bar = {
        id: id++,
        left: Math.random() * 100,
        width: 8 + Math.random() * 50,
        top: Math.random() * 100,
        height: 6 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: 120 + Math.random() * 300,
      };

      setBars(prev => [...prev.slice(-8), bar]);

      setTimeout(() => {
        setBars(prev => prev.filter(b => b.id !== bar.id));
      }, bar.duration);
    };

    const interval = setInterval(() => {
      if (!isHeroVisible) {
        // Much less frequent outside hero section
        if (Math.random() < 0.08) createBar();
      } else {
        // Frequent in hero section
        if (Math.random() < 0.4) createBar();
        if (Math.random() < 0.25) createBar();
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isHeroVisible]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {bars.map(bar => (
        <div
          key={bar.id}
          className="absolute"
          style={{
            left: `${bar.left}%`,
            top: `${bar.top}%`,
            width: `${bar.width}%`,
            height: `${bar.height}px`,
            backgroundColor: bar.color,
            animation: `glitchBar ${bar.duration}ms ease-out forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes glitchBar {
          0% { opacity: 0; transform: scaleX(0) translateX(-50%); }
          15% { opacity: 1; transform: scaleX(1) translateX(0); }
          35% { opacity: 1; transform: scaleX(1) translateX(0); }
          55% { opacity: 0.6; transform: scaleX(0.9) translateX(8%); }
          75% { opacity: 0.3; transform: scaleX(0.6) translateX(-5%); }
          100% { opacity: 0; transform: scaleX(0) translateX(15%); }
        }
      `}</style>
    </div>
  );
}

function GlitchText({ children, className = '' }: { children: string; className?: string }) {
  const [glitching, setGlitching] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const triggerGlitch = () => {
      setGlitching(true);
      setFrame(0);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setFrame(f => f + 1);
        if (count > 8) {
          clearInterval(interval);
          setGlitching(false);
        }
      }, 55);
    };

    const scheduleNext = () => {
      const delay = 2500 + Math.random() * 2000;
      setTimeout(() => {
        triggerGlitch();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {};
  }, []);

  const getRandomClip = () => {
    const clips = [
      'polygon(0 0%, 100% 0%, 100% 22%, 0 22%)',
      'polygon(0 28%, 100% 28%, 100% 48%, 0 48%)',
      'polygon(0 52%, 100% 52%, 100% 72%, 0 72%)',
      'polygon(0 76%, 100% 76%, 100% 100%, 0 100%)',
    ];
    return clips[Math.floor(Math.random() * clips.length)];
  };

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      {glitching && frame > 0 && frame < 8 && (
        <>
          <span
            className="absolute inset-0 text-red-500 z-20 font-black"
            style={{
              clipPath: getRandomClip(),
              transform: `translateX(${(Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 6)}px)`,
            }}
          >
            {children}
          </span>
          <span
            className="absolute inset-0 text-cyan-400 z-20 font-black"
            style={{
              clipPath: getRandomClip(),
              transform: `translateX(${(Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 6)}px)`,
            }}
          >
            {children}
          </span>
        </>
      )}
    </span>
  );
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Crash-in card: fly from outside toward center, collide and bounce
function CrashCard({ feature, index, t }: { feature: typeof FEATURES[0]; index: number; t: (key: string) => string }) {
  const { ref, isVisible } = useInView();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const [phase, setPhase] = useState<'idle' | 'approach' | 'impact' | 'settle' | 'landed'>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const isLeftColumn = index % 2 === 0;
  const rotation = useRef((Math.random() - 0.5) * 12);
  const phaseRef = useRef('idle');
  const isAnimatedRef = useRef(false);

  useEffect(() => {
    if (isVisible && phaseRef.current === 'idle' && !isAnimatedRef.current) {
      isAnimatedRef.current = true;
      phaseRef.current = 'approach';
      setPhase('approach');

      setTimeout(() => {
        phaseRef.current = 'impact';
        setPhase('impact');
      }, 300);

      setTimeout(() => {
        phaseRef.current = 'settle';
        setPhase('settle');
      }, 420);

      setTimeout(() => {
        phaseRef.current = 'landed';
        setPhase('landed');
      }, 620);
    }
  }, [isVisible]);

  const getTransform = () => {
    const rot = rotation.current;
    const farX = 500;

    switch (phase) {
      case 'idle':
        return isLeftColumn
          ? `translateX(${-farX}px) translateY(-30px) rotate(-8deg)`
          : `translateX(${farX}px) translateY(-30px) rotate(8deg)`;
      case 'approach':
        return `translateX(0) translateY(0) rotate(0deg)`;
      case 'impact':
        return isLeftColumn
          ? `translateX(15px) translateY(-4px) rotate(${rot * 0.4}deg) scale(1.03)`
          : `translateX(-15px) translateY(-4px) rotate(${rot * 0.4}deg) scale(1.03)`;
      case 'settle':
        return isLeftColumn
          ? `translateX(-6px) translateY(-2px) rotate(${rot * 0.2}deg) scale(0.99)`
          : `translateX(6px) translateY(-2px) rotate(${rot * 0.2}deg) scale(0.99)`;
      case 'landed':
      default:
        return `translateX(0) translateY(0) rotate(${rot}deg) scale(1)`;
    }
  };

  const getTransition = () => {
    if (phase === 'approach') return 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    if (phase === 'impact') return 'transform 100ms cubic-bezier(0.17, 0.67, 0.29, 1.4)';
    if (phase === 'settle') return 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    if (phase === 'idle') return 'none';
    return 'none';
  };

  const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];

  return (
    <div
      ref={ref}
      className={`relative ${color.bg} border-2 ${color.border} p-10 overflow-hidden`}
      style={{
        transform: getTransform(),
        transition: getTransition(),
        boxShadow: phase === 'impact'
          ? `0 0 60px ${color.hex}50, 0 0 120px ${color.hex}30, inset 0 0 40px ${color.hex}15`
          : phase === 'settle'
            ? `0 0 45px ${color.hex}40, 0 0 100px ${color.hex}20, inset 0 0 25px ${color.hex}10`
            : phase === 'landed'
              ? `0 0 35px ${color.hex}30, inset 0 0 20px ${color.hex}08`
              : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content layer */}
      <div className={`relative z-10 flex flex-col justify-center min-h-[140px] ${isLeftColumn ? 'pl-2 pr-28' : 'pr-2 pl-28'}`}>
        <h3 className={`text-2xl font-bold mb-3 ${isLeftColumn ? '' : 'text-right'}`} style={{ color: color.hex }}>
          {t(feature.title)}
        </h3>
        <p className={`text-base text-zinc-400 leading-relaxed ${isLeftColumn ? '' : 'text-right'}`}>
          {t(feature.desc)}
        </p>
      </div>

      {/* Large icon on OPPOSITE side */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 ${isLeftColumn ? 'right-4 left-auto' : 'left-4 right-auto'}`}
        style={{
          opacity: isHovered ? 0.8 : 0.08,
          filter: isHovered
            ? `drop-shadow(0 0 30px ${color.hex}90) drop-shadow(0 0 60px ${color.hex}50)`
            : `drop-shadow(0 0 8px ${color.hex}20)`,
        }}
      >
        <Icon className="h-36 w-36" style={{ color: color.hex }} />
      </div>

      {/* Bottom accent bar - left cards: left→right, right cards: right→left */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: isLeftColumn
            ? `linear-gradient(90deg, ${color.hex}, transparent)`
            : `linear-gradient(90deg, transparent, ${color.hex})`,
          transformOrigin: isLeftColumn ? 'left' : 'right',
          transform: isHovered ? 'scaleX(1)' : 'scaleX(0.15)',
          opacity: isHovered ? 1 : 0.4,
          transition: 'transform 500ms ease, opacity 500ms ease',
        }}
      />
    </div>
  );
}

// Timeline item
function TimelineItem({ capability, index, t }: { capability: typeof CAPABILITIES[0]; index: number; t: (key: string) => string }) {
  const { ref, isVisible } = useInView();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const [isHovered, setIsHovered] = useState(false);
  const isLeft = index % 2 === 0;
  const Icon = CAPABILITY_ICONS[index % CAPABILITY_ICONS.length];

  return (
    <div ref={ref} className="relative min-h-[100px] flex items-center">
      {/* Timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2" />

      {/* Center node */}
      <div
        className="absolute z-20 transition-all duration-300"
        style={{
          left: '50%',
          top: '50%',
          transform: `translateX(-50%) translateY(-50%) scale(${isHovered ? 1.25 : 1})`,
          filter: isHovered ? `drop-shadow(0 0 20px ${color.hex})` : `drop-shadow(0 0 8px ${color.hex}50)`,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl border-[3px] flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: `${color.hex}15`,
            borderColor: color.hex,
            boxShadow: isHovered
              ? `0 0 40px ${color.hex}70, inset 0 0 20px ${color.hex}25`
              : `0 0 20px ${color.hex}40, inset 0 0 10px ${color.hex}15`,
          }}
        >
          <Icon className="h-8 w-8" style={{ color: color.hex }} />
        </div>
      </div>

      {/* Content card */}
      <div
        className={`w-[calc(50%-6rem)] transition-all duration-700 flex items-center ${isLeft ? 'ml-auto pr-16' : 'mr-auto pl-16'}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : isLeft ? 'translateX(80px)' : 'translateX(-80px)',
          transitionDelay: `${index * 150}ms`,
        }}
      >
        <div
          className={`${color.bg} border-2 ${color.border} rounded-2xl p-6 w-full transition-all duration-300 ${isHovered ? 'scale-[1.03]' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            boxShadow: isHovered ? `0 0 50px ${color.hex}40, 0 0 30px ${color.hex}20` : 'none',
          }}
        >
          <h4 className="text-xl font-bold" style={{ color: color.hex }}>
            {t(capability.title)}
          </h4>
          <div
            className="overflow-hidden"
            style={{
              maxHeight: isHovered ? '200px' : '0',
              opacity: isHovered ? 1 : 0,
              transition: 'max-height 400ms ease, opacity 400ms ease',
            }}
          >
            <p className="text-base text-zinc-400 leading-relaxed pt-3">
              {t(capability.desc)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating circular stat
function FloatingStat({ value, suffix, label, index }: { value: string; suffix: string; label: string; index: number }) {
  const { ref, isVisible } = useInView();
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const circleSize = 180;

  useEffect(() => {
    if (!isVisible) return;

    const animate = () => {
      setOffset({
        x: (Math.random() - 0.5) * 35,
        y: (Math.random() - 0.5) * 35,
      });
      setRotation(prev => prev + (Math.random() - 0.5) * 8);
    };

    const interval = setInterval(animate, 1500 + Math.random() * 1500);
    animate();

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.7s',
      }}
    >
      <div
        className="relative"
        style={{
          width: circleSize,
          height: circleSize,
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
          transition: 'transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Circle */}
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center flex-col"
          style={{
            backgroundColor: `${color.hex}08`,
            border: `5px solid ${color.hex}`,
            boxShadow: `0 0 60px ${color.hex}60, 0 0 100px ${color.hex}35, inset 0 0 50px ${color.hex}18`,
          }}
        >
          <div
            className="text-4xl md:text-5xl font-black"
            style={{ color: color.hex, textShadow: `0 0 40px ${color.hex}90` }}
          >
            {value}<span className="text-zinc-500 text-3xl">{suffix}</span>
          </div>
          <div className="text-sm font-medium text-zinc-400 mt-2 tracking-wide">{label}</div>
        </div>

        {/* Rotating glow ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            animation: 'spinGlow 3s linear infinite',
            background: `conic-gradient(from 0deg, transparent 0%, ${color.hex}50 8%, transparent 16%, ${color.hex}30 24%, transparent 32%)`,
            mask: `radial-gradient(circle, black 86px, transparent 88px)`,
            WebkitMask: `radial-gradient(circle, black 86px, transparent 88px)`,
          }}
        />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const isLoggedIn = !!user;

  useEffect(() => {
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'zh' : 'en');
  };

  return (
    <main className="bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <GlitchBars />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50">
        <h1
          className="text-2xl font-bold tracking-tight logo-glitch"
          style={{
            color: '#00e5ff',
            textShadow: '0 0 40px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.25)',
          }}
        >
          AGENTOPS
        </h1>
        <div className="flex items-center gap-6">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-2 text-base font-semibold hover:text-cyan-300 transition-colors"
          >
            <Globe className="h-5 w-5" />
            {locale === 'en' ? '中文' : 'EN'}
          </button>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="text-base font-semibold px-6 py-3 border-2 border-cyan-400/50 hover:border-cyan-400 transition-all"
              style={{ boxShadow: '0 0 20px rgba(0,229,255,0.15)' }}
            >
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-base font-semibold hover:text-cyan-300 transition-colors">
                {t('nav.signIn')}
              </Link>
              <Link
                href="/auth/register"
                className="text-base font-semibold px-6 py-3 transition-all hover:scale-105"
                style={{ backgroundColor: '#00e5ff', color: '#0a0a0a', boxShadow: '0 0 25px rgba(0,229,255,0.4)' }}
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center relative px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 60%)' }} />

        <div className="text-center relative z-10">
          <h1
            className="text-[16vw] leading-none font-black tracking-tighter mb-0 relative"
            style={{
              color: '#fafafa',
              textShadow: '0 0 50px rgba(0,229,255,0.35), 0 0 100px rgba(0,229,255,0.15)',
            }}
          >
            <GlitchText>AGENT</GlitchText>
          </h1>
          <h2
            className="text-[10vw] leading-none font-black -mt-4 md:-mt-6 mb-8"
            style={{ color: '#00e5ff', textShadow: '0 0 40px rgba(0,229,255,0.5)' }}
          >
            OPS
          </h2>

          <p className="text-lg md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed text-zinc-400">
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-xl font-semibold px-10 py-4 transition-all hover:scale-105 inline-flex items-center gap-3"
                style={{ backgroundColor: '#00e5ff', color: '#0a0a0a', boxShadow: '0 0 35px rgba(0,229,255,0.4)' }}
              >
                {t('landing.openDashboard')} <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="text-xl font-semibold px-10 py-4 transition-all hover:scale-105 inline-flex items-center gap-3"
                  style={{ backgroundColor: '#00e5ff', color: '#0a0a0a', boxShadow: '0 0 35px rgba(0,229,255,0.4)' }}
                >
                  {t('landing.getStarted')} <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/auth/login"
                  className="text-xl font-semibold px-10 py-4 border-2 border-zinc-700 hover:border-zinc-500 transition-all inline-flex items-center gap-3"
                >
                  {t('landing.viewDemo')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-zinc-700 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-zinc-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="min-h-screen py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2
              className="text-[12vw] leading-none font-black mb-16"
              style={{ color: '#00e5ff', textShadow: '0 0 50px rgba(0,229,255,0.4)' }}
            >
              CORE
            </h2>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-14">
            {FEATURES.map((feature, i) => (
              <CrashCard key={feature.title} feature={feature} index={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities - Timeline */}
      <section className="py-32 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2
              className="text-[10vw] leading-none font-black mb-20"
              style={{ color: '#ff4081', textShadow: '0 0 50px rgba(255,64,129,0.4)' }}
            >
              POWER
            </h2>
          </RevealSection>

          <div className="relative">
            {CAPABILITIES.map((capability, i) => (
              <TimelineItem key={capability.title} capability={capability} index={i} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32 px-6 border-t border-zinc-800/50 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 items-center justify-items-center">
            {[
              { value: '99.9', suffix: '%', label: t('landing.stats.uptime') },
              { value: '<100', suffix: 'ms', label: t('landing.stats.response') },
              { value: '10', suffix: 'M+', label: t('landing.stats.tokens') },
              { value: '50+', suffix: '', label: t('landing.stats.integrations') },
            ].map((stat, i) => (
              <FloatingStat key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="min-h-[70vh] flex items-center justify-center px-6 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(234,128,252,0.2) 0%, transparent 60%)' }} />
        </div>

        <div className="text-center relative z-10">
          <RevealSection>
            <h2
              className="text-[10vw] md:text-[8vw] leading-none font-black mb-8"
              style={{ color: '#fafafa', textShadow: '0 0 40px rgba(250,250,250,0.15)' }}
            >
              <GlitchText>{t('landing.readyTitle')}</GlitchText>
            </h2>
          </RevealSection>
          <RevealSection delay={200}>
            <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-md mx-auto">
              {t('landing.readySubtitle')}
            </p>
          </RevealSection>
          <RevealSection delay={400}>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-3 text-xl font-semibold px-10 py-5 transition-all hover:scale-105"
              style={{ backgroundColor: '#ea80fc', color: '#0a0a0a', boxShadow: '0 0 40px rgba(234,128,252,0.5)' }}
            >
              {t('landing.createFree')} <ArrowRight className="h-6 w-6" />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: '#00e5ff', boxShadow: '0 0 20px rgba(0,229,255,0.5)' }}
            />
            <span className="font-bold text-lg">AGENTOPS STUDIO</span>
          </div>

          <div className="flex gap-8 text-base font-medium text-zinc-500">
            <Link href="/workflows" className="hover:text-zinc-300 transition-colors">{t('landing.footer.documentation')}</Link>
            <Link href="/auth/login" className="hover:text-zinc-300 transition-colors">{t('landing.footer.signIn')}</Link>
            <Link href="/auth/register" className="hover:text-zinc-300 transition-colors">{t('landing.footer.signUp')}</Link>
          </div>

          <div className="text-base text-zinc-600">
            {t('landing.footer.tagline')}
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;900&display=swap');

        * {
          font-family: 'Noto Sans SC', ui-sans-serif, system-ui, sans-serif;
        }

        ::selection {
          background: rgba(0, 229, 255, 0.3);
          color: #fafafa;
        }

        @keyframes rgbSplit {
          0% { text-shadow: -2px 0 #ff0040, 2px 0 #00ffff; }
          5% { text-shadow: 4px 0 #ff0040, -4px 0 #00ffff, 0 0 8px rgba(255,255,255,0.4); }
          10% { text-shadow: -2px 0 #ff0040, 2px 0 #00ffff; }
          15% { text-shadow: 6px 0 #ff0040, -6px 0 #00ffff, 0 0 15px rgba(255,255,255,0.25); }
          20% { text-shadow: -2px 0 #ff0040, 2px 0 #00ffff; }
          100% { text-shadow: -2px 0 #ff0040, 2px 0 #00ffff; }
        }

        @keyframes logoGlitch {
          0% { text-shadow: -1px 0 #ff0040, 1px 0 #00ffff; opacity: 0; }
          3% { text-shadow: 2px 0 #ff0040, -2px 0 #00ffff; opacity: 1; }
          6% { text-shadow: -1px 0 #ff0040, 1px 0 #00ffff; opacity: 0.8; }
          9% { text-shadow: 3px 0 #ff0040, -3px 0 #00ffff; opacity: 1; }
          12% { text-shadow: -1px 0 #ff0040, 1px 0 #00ffff; opacity: 0; }
          100% { text-shadow: -1px 0 #ff0040, 1px 0 #00ffff; opacity: 0; }
        }

        @keyframes spinGlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        h1:first-of-type {
          animation: rgbSplit 4s infinite;
        }

        .logo-glitch {
          animation: logoGlitch 5s infinite;
          animation-delay: 1.5s;
        }
      `}</style>
    </main>
  );
}
