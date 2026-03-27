'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { useTranslation } from '../contexts/locale-context';
import {
  Brain, GitBranch, Users, BarChart3, Shield,
  ArrowRight, CheckCircle2, Database,
  Sparkles, Workflow, Cpu, Zap, Globe, Terminal
} from 'lucide-react';

const FEATURES = [
  {
    icon: GitBranch,
    titleKey: 'landing.features.workflow.title',
    descKey: 'landing.features.workflow.desc',
    color: 'emerald',
  },
  {
    icon: Brain,
    titleKey: 'landing.features.multiModel.title',
    descKey: 'landing.features.multiModel.desc',
    color: 'cyan',
  },
  {
    icon: Database,
    titleKey: 'landing.features.rag.title',
    descKey: 'landing.features.rag.desc',
    color: 'amber',
  },
  {
    icon: Users,
    titleKey: 'landing.features.humanReview.title',
    descKey: 'landing.features.humanReview.desc',
    color: 'pink',
  },
  {
    icon: BarChart3,
    titleKey: 'landing.features.analytics.title',
    descKey: 'landing.features.analytics.desc',
    color: 'violet',
  },
  {
    icon: Shield,
    titleKey: 'landing.features.security.title',
    descKey: 'landing.features.security.desc',
    color: 'teal',
  },
];

const CAPABILITY_KEYS = [
  'landing.capabilities.async',
  'landing.capabilities.websocket',
  'landing.capabilities.versionControl',
  'landing.capabilities.conditional',
  'landing.capabilities.context',
  'landing.capabilities.retry',
] as const;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

function ConstellationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#f43f5e'];

    const initParticles = () => {
      particlesRef.current = [];
      const count = Math.min(80, Math.floor(window.innerWidth / 15));
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };
    initParticles();

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (frame % 3 === 0) {
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 * (1 - dist / 150)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }

        const mdx = mouseRef.current.x - p.x;
        const mdy = mouseRef.current.y - p.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.25 * (1 - mDist / 120)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouse);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [started, target]);

  return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

function FeatureCard({ icon: Icon, titleKey, descKey, color, t, index }: {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  color: string;
  t: (key: string) => string;
  index: number;
}) {
  const colorClasses: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'text-emerald-400', glow: 'hover:shadow-emerald-500/20' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: 'text-cyan-400', glow: 'hover:shadow-cyan-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400', glow: 'hover:shadow-amber-500/20' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', icon: 'text-pink-400', glow: 'hover:shadow-pink-500/20' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: 'text-violet-400', glow: 'hover:shadow-violet-500/20' },
    teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', icon: 'text-teal-400', glow: 'hover:shadow-teal-500/20' },
  };
  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div
      className={`group relative rounded-2xl border ${colors.border} ${colors.bg} p-6 backdrop-blur-sm transition-all duration-500 hover:${colors.glow} hover:scale-[1.02] hover:bg-slate-900/90`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className={`inline-flex rounded-xl ${colors.bg} p-3 ring-1 ring-white/10`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">{t(titleKey)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{t(descKey)}</p>
      </div>
    </div>
  );
}

function TerminalWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-800/50 bg-slate-900/80 px-4 py-3">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="ml-4 flex items-center gap-2 rounded-md bg-slate-800/50 px-3 py-1 text-xs text-slate-400">
          <Terminal className="h-3 w-3" />
          workflow.json
        </div>
      </div>
      <div className="p-4 font-mono text-sm">{children}</div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLoggedIn = !!user;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <ConstellationCanvas />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Workflow className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold text-white">AgentOps</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t('landing.goToDashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-white"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
                >
                  {t('landing.getStarted')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-32">
        <div className="text-center" style={{ transform: `translateY(${scrollY * 0.3}px)`, opacity: 1 - scrollY * 0.001 }}>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300 backdrop-blur-sm">
            <Zap className="h-4 w-4" aria-hidden="true" />
            {t('landing.tagline')}
          </div>

          <h1 className="mx-auto max-w-5xl text-6xl font-bold leading-tight tracking-tight md:text-7xl lg:text-8xl">
            <span className="block bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {t('landing.heroTitle')}
            </span>
            <span className="mt-2 block bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              {t('landing.heroTitleAccent')}
            </span>
          </h1>

          <p className="mx-auto mt-10 max-w-2xl text-xl text-slate-400 leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
              >
                <Cpu className="h-6 w-6" aria-hidden="true" />
                {t('landing.openDashboard')}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
                >
                  <Globe className="h-6 w-6" aria-hidden="true" />
                  {t('landing.getStarted')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-3 rounded-2xl border-2 border-slate-700 px-10 py-5 text-lg font-medium text-white transition-all hover:border-emerald-500/50 hover:bg-slate-800/30"
                >
                  {t('landing.viewDemo')}
                </Link>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-10 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span>{t('landing.noCreditCard')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span>{t('landing.deployMinutes')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span>{t('landing.multiModel')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Demo Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-20 text-center">
          <h2 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            {t('landing.workflowBuilder')}
          </h2>
          <p className="mt-5 text-lg text-slate-400">
            {t('landing.workflowBuilderDesc')}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <TerminalWindow>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">01</span>
                <span className="text-slate-500">{"{"}</span>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="text-cyan-400">{`"nodes"`}</span>
                <span className="text-slate-500">:</span>
                <span className="text-slate-500">{`["`}</span>
              </div>
              <div className="flex items-center gap-3 pl-8">
                <span className="text-amber-400">{"{"}</span>
                <span className="text-pink-400">{`"type"`}</span>
                <span className="text-slate-500">:</span>
                <span className="text-emerald-300">{`"llm"`}</span>
                <span className="text-slate-500">,</span>
              </div>
              <div className="flex items-center gap-3 pl-16">
                <span className="text-pink-400">{`"model"`}</span>
                <span className="text-slate-500">:</span>
                <span className="text-emerald-300">{`"gpt-4"`}</span>
              </div>
              <div className="flex items-center gap-3 pl-8">
                <span className="text-amber-400">{"}"}</span>
                <span className="text-slate-500">,</span>
              </div>
              <div className="flex items-center gap-3 pl-8">
                <span className="text-amber-400">{"{"}</span>
                <span className="text-pink-400">{`"type"`}</span>
                <span className="text-slate-500">:</span>
                <span className="text-emerald-300">{`"condition"`}</span>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="text-slate-500">{"]"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{"}"}</span>
              </div>
            </div>
          </TerminalWindow>

          <div className="space-y-6">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/30">
                <GitBranch className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('landing.features.workflow.title')}</h3>
                <p className="mt-2 text-slate-400">{t('landing.features.workflow.desc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-cyan-500/30">
                <Brain className="h-6 w-6 text-cyan-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('landing.features.multiModel.title')}</h3>
                <p className="mt-2 text-slate-400">{t('landing.features.multiModel.desc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 ring-1 ring-pink-500/30">
                <Users className="h-6 w-6 text-pink-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('landing.features.humanReview.title')}</h3>
                <p className="mt-2 text-slate-400">{t('landing.features.humanReview.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-16 text-center">
          <h2 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            {t('landing.featuresTitle')}
          </h2>
          <p className="mt-5 text-lg text-slate-400">
            {t('landing.featuresSubtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.titleKey} {...feature} t={t} index={index} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-32">
        <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-900/40 p-12 backdrop-blur-sm">
          <div className="mb-12 text-center">
            <h2 className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              {t('landing.builtForProduction')}
            </h2>
            <p className="mt-5 text-lg text-slate-400">
              {t('landing.builtForProductionDesc')}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              {CAPABILITY_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-4 rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  </div>
                  <span className="text-slate-200">{t(key)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8 text-center transition-all hover:border-emerald-500/50 hover:bg-slate-900/80 hover:scale-105">
                <div className="text-5xl font-bold text-emerald-400">
                  <AnimatedCounter target={99} suffix=".9%" />
                </div>
                <div className="mt-2 text-sm text-slate-400">{t('landing.stats.uptime')}</div>
              </div>
              <div className="group rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8 text-center transition-all hover:border-cyan-500/50 hover:bg-slate-900/80 hover:scale-105">
                <div className="text-5xl font-bold text-cyan-400">
                  <AnimatedCounter target={100} suffix="ms" />
                </div>
                <div className="mt-2 text-sm text-slate-400">{t('landing.stats.response')}</div>
              </div>
              <div className="group rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8 text-center transition-all hover:border-amber-500/50 hover:bg-slate-900/80 hover:scale-105">
                <div className="text-5xl font-bold text-amber-400">
                  <AnimatedCounter target={10} suffix="M+" />
                </div>
                <div className="mt-2 text-sm text-slate-400">{t('landing.stats.tokens')}</div>
              </div>
              <div className="group rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8 text-center transition-all hover:border-violet-500/50 hover:bg-slate-900/80 hover:scale-105">
                <div className="text-5xl font-bold text-violet-400">
                  <AnimatedCounter target={50} suffix="+" />
                </div>
                <div className="mt-2 text-sm text-slate-400">{t('landing.stats.integrations')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 p-16 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-transparent to-transparent" />
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-teal-500/20 blur-3xl" />

          <div className="relative">
            <Sparkles className="mx-auto h-12 w-12 text-emerald-400" aria-hidden="true" />
            <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
              {t('landing.readyTitle')}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
              {t('landing.readySubtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
              >
                {t('landing.createFree')}
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-950/80 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Workflow className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-white">AgentOps Studio</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <Link href="/workflows" className="hover:text-emerald-400 transition-colors">{t('landing.footer.documentation')}</Link>
              <Link href="/auth/login" className="hover:text-emerald-400 transition-colors">{t('landing.footer.signIn')}</Link>
              <Link href="/auth/register" className="hover:text-emerald-400 transition-colors">{t('landing.footer.signUp')}</Link>
            </div>
            <div className="text-sm text-slate-500">
              {t('landing.footer.tagline')}
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
    </main>
  );
}
