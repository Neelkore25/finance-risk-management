import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Search, Download, Eye, ExternalLink, Filter, 
  Terminal, ShieldCheck, Zap, Layers, Globe, Code, ArrowUpRight, 
  CheckCircle2, Cpu, X, Play, Copy, Check
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 1,
    title: "Quantum Risk Analytics Dashboard",
    category: "React",
    techStack: ["React 18", "Tailwind CSS", "Recharts", "Supabase"],
    description: "Institutional-grade financial risk scoring engine with Value at Risk (VaR) Monte Carlo simulation models.",
    previewImage: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=1000&auto=format&fit=crop",
    downloads: "4.8k",
    rating: 4.9,
    badge: "Featured",
    badgeColor: "#00F5FF",
    features: ["Real-time VaR Engine", "Scikit-Learn ML Integration", "100% Solid Opaque Glass panels"]
  },
  {
    id: 2,
    title: "Neural AI Command Center",
    category: "Next.js",
    techStack: ["Next.js 14", "TypeScript", "Framer Motion", "Gemini API"],
    description: "Futuristic artificial intelligence monitoring panel with real-time prompt token telemetry and live RAG vector search.",
    previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    downloads: "3.2k",
    rating: 4.95,
    badge: "Hot",
    badgeColor: "#9D4EDD",
    features: ["RAG Vector Pipeline", "Gemini 2.5 Flash SDK", "3D Canvas Particle Mesh"]
  },
  {
    id: 3,
    title: "Apex Crypto Terminal UI",
    category: "Tailwind CSS",
    techStack: ["Tailwind CSS", "Vanilla JS", "TradingView API", "WebSockets"],
    description: "High-frequency cryptocurrency trading desk layout featuring order-book heatmaps and liquidity depth charts.",
    previewImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop",
    downloads: "6.1k",
    rating: 4.88,
    badge: "Popular",
    badgeColor: "#00F5A0",
    features: ["WebSocket Live Orderbook", "Custom Neon Candles", "Sub-10ms Render Pipeline"]
  },
  {
    id: 4,
    title: "CyberSec SOC Threat Monitor",
    category: "Python/Django",
    techStack: ["Django 5", "Python", "Tailwind CSS", "Redis"],
    description: "Security Operations Center dashboard for intrusion detection, IP telemetry, and automated firewall rules.",
    previewImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
    downloads: "2.9k",
    rating: 4.92,
    badge: "Security",
    badgeColor: "#00F5FF",
    features: ["Live Attack World Map", "Automated IP Banning", "JWT Role Access Control"]
  },
  {
    id: 5,
    title: "Orbital SaaS Analytics Suite",
    category: "React",
    techStack: ["React 18", "Vite", "Lucide Icons", "PostgreSQL"],
    description: "SaaS recurring revenue (MRR/ARR) analytics dashboard with churn prediction models and cohort retention grids.",
    previewImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
    downloads: "5.4k",
    rating: 4.85,
    badge: "SaaS Top Pick",
    badgeColor: "#9D4EDD",
    features: ["Cohort Churn Analytics", "Stripe Webhook Sync", "Multi-Tenant Workspaces"]
  },
  {
    id: 6,
    title: "HyperDrive Logistics Admin",
    category: "Bootstrap 5",
    techStack: ["Bootstrap 5.3", "HTML5", "Chart.js", "Leaflet Maps"],
    description: "Global fleet management and real-time GPS asset tracker with automated route optimization algorithms.",
    previewImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop",
    downloads: "1.8k",
    rating: 4.79,
    badge: "Enterprise",
    badgeColor: "#00F5A0",
    features: ["Interactive Leaflet Maps", "Vehicle Telemetry", "Automated Driver Alerts"]
  },
  {
    id: 7,
    title: "Aether Cloud Infrastructure Portal",
    category: "Next.js",
    techStack: ["Next.js", "Tailwind CSS", "Kubernetes API", "Docker"],
    description: "Cloud container cluster dashboard monitoring pod CPU consumption, RAM allocation, and autoscaling thresholds.",
    previewImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    downloads: "3.9k",
    rating: 4.91,
    badge: "DevOps",
    badgeColor: "#00F5FF",
    features: ["Kubernetes Pod Status", "Prometheus Metrics Sync", "One-Click Deploy Trigger"]
  },
  {
    id: 8,
    title: "Vortex Gaming Network Admin",
    category: "React",
    techStack: ["React 18", "Tailwind CSS", "Three.js", "WebRTC"],
    description: "Esports tournament management portal with match bracket generators and low-latency voice room telemetry.",
    previewImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000&auto=format&fit=crop",
    downloads: "4.1k",
    rating: 4.87,
    badge: "Gaming",
    badgeColor: "#9D4EDD",
    features: ["Double Elimination Brackets", "WebRTC Voice Hub", "Live Twitch Stream Embed"]
  },
  {
    id: 9,
    title: "BioLab Healthcare Data Portal",
    category: "Python/Django",
    techStack: ["Django", "Python SciPy", "Tailwind CSS", "FHIR API"],
    description: "HIPAA-compliant medical research analytics dashboard visualizing patient bio-marker trends and trial outcomes.",
    previewImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000&auto=format&fit=crop",
    downloads: "2.3k",
    rating: 4.94,
    badge: "Medical",
    badgeColor: "#00F5A0",
    features: ["HIPAA Audit Logs", "FHIR Interoperability", "SciPy Clinical Correlations"]
  },
  {
    id: 10,
    title: "Titan Fintech Payment Gateway",
    category: "React",
    techStack: ["React 18", "Tailwind CSS", "Razorpay / Stripe", "Zustand"],
    description: "International multi-currency payment gateway dashboard supporting fraud detection scoring and payout settlement timelines.",
    previewImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1000&auto=format&fit=crop",
    downloads: "7.8k",
    rating: 4.97,
    badge: "Fintech Leader",
    badgeColor: "#00F5FF",
    features: ["Fraud Score Probability", "Instant Payout Schedulers", "Multi-Currency Convertor"]
  }
];

export function AntigravityShowcase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [gravityMode, setGravityMode] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const canvasRef = useRef(null);

  // Particle Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.5,
      color: Math.random() > 0.5 ? '#00F5FF' : '#9D4EDD',
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Keyboard shortcut Ctrl + K handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('antigravity-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = ['All', 'React', 'Next.js', 'Tailwind CSS', 'Bootstrap 5', 'Python/Django'];

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.techStack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = (id) => {
    setCopiedId(id);
    navigator.clipboard.writeText(`git clone https://github.com/AntigravityAdmin/template-${id}.git`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0B10] text-slate-100 relative font-sans overflow-x-hidden selection:bg-[#00F5FF]/30">
      {/* Background Particle Mesh Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />

      {/* Ambient Radial Gradient Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#00F5FF]/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[#9D4EDD]/10 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse" />

      {/* MAIN CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* HEADER NAVIGATION */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0F172A]/40 border border-[#00F5FF]/20 shadow-[0_0_25px_rgba(0,245,255,0.05)] backdrop-blur-md opacity-100">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00F5FF] to-[#9D4EDD] p-0.5 shadow-[0_0_15px_rgba(0,245,255,0.4)]">
              <div className="w-full h-full bg-[#0A0B10] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#00F5FF] animate-spin" style={{ animationDuration: '8s' }} />
              </div>
            </div>
            <div>
              <div className="text-base font-extrabold tracking-wider text-white flex items-center gap-1.5 font-display">
                ANTIGRAVITY <span className="text-[#00F5FF] drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]">ADMIN</span>
              </div>
              <div className="text-[9.5px] font-bold text-[#A0AEC0] tracking-[2px] uppercase">
                FUTURISTIC SHOWCASE HUB
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#A0AEC0] absolute left-3 top-3" />
            <input
              id="antigravity-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or tech stack..."
              className="w-full pl-9 pr-14 py-2 bg-[#0A0B10]/80 border border-[#00F5FF]/30 rounded-xl text-xs text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00F5FF] focus:shadow-[0_0_15px_rgba(0,245,255,0.2)] transition-all"
            />
            <kbd className="absolute right-2.5 top-2.5 px-1.5 py-0.5 text-[9.5px] font-bold bg-[#1E293B] text-[#A0AEC0] rounded border border-slate-700">
              Ctrl K
            </kbd>
          </div>

          {/* Nav Links & Gravity Switcher */}
          <div className="flex items-center gap-4 text-xs font-semibold text-[#A0AEC0]">
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Home</a>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Marketplace</a>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Docs</a>
            <a href="#" className="hover:text-[#00F5FF] transition-colors flex items-center gap-1 text-[#00F5FF]">
              <Zap className="w-3.5 h-3.5 text-[#00F5A0]" /> AI Tools
            </a>

            {/* Zero-Gravity Mode Switch */}
            <button
              onClick={() => setGravityMode(!gravityMode)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                gravityMode
                  ? 'bg-[#00F5FF]/10 border-[#00F5FF]/40 text-[#00F5FF] shadow-[0_0_12px_rgba(0,245,255,0.3)]'
                  : 'bg-[#1E293B] border-slate-700 text-[#A0AEC0]'
              }`}
              title="Toggle Zero-Gravity Physics Transforms"
            >
              <Cpu className="w-4 h-4" />
              <span className="text-[10px] font-extrabold uppercase hidden lg:inline">
                {gravityMode ? 'Gravity OFF' : 'Gravity ON'}
              </span>
            </button>
          </div>
        </header>

        {/* HERO BANNER SECTION */}
        <section className="text-center py-8 space-y-4 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-xs font-bold shadow-[0_0_15px_rgba(0,245,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping" />
            2026 NEXT-GEN ADMIN SHOWCASE
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display max-w-3xl mx-auto leading-tight">
            10+ Best Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5FF] via-[#9D4EDD] to-[#00F5A0]">Antigravity Admin</span> Templates & Components
          </h1>

          <p className="text-sm text-[#A0AEC0] max-w-2xl mx-auto leading-relaxed">
            Zero-gravity design language featuring glassmorphism panels, high-frequency chart suites, 
            Scikit-Learn ML telemetry, and Google Gemini 2.5 Flash SDK integrations.
          </p>
        </section>

        {/* SECONDARY TECH STACK FILTER BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#A0AEC0] pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#00F5FF]" /> Tech Stack:
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] text-white border-transparent shadow-[0_0_15px_rgba(0,245,255,0.4)] scale-105'
                  : 'bg-[#0F172A]/40 text-[#A0AEC0] border-slate-800 hover:border-[#00F5FF]/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* MAIN TEMPLATES SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((item) => (
            <div
              key={item.id}
              className={`group relative bg-[#0F172A]/50 border border-[#00F5FF]/20 rounded-2xl p-5 shadow-[0_0_25px_rgba(0,245,255,0.03)] backdrop-blur-md transition-all duration-300 flex flex-col justify-between hover:border-[#00F5FF]/60 hover:shadow-[0_0_30px_rgba(0,245,255,0.2)] ${
                gravityMode ? 'hover:-translate-y-2 hover:rotate-1' : ''
              }`}
            >
              {/* Card Preview Image with Hover Lift */}
              <div className="relative h-44 rounded-xl overflow-hidden mb-4 border border-slate-800 group-hover:border-[#00F5FF]/40 transition-colors">
                <img
                  src={item.previewImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B10] via-transparent to-transparent opacity-80" />

                {/* Floating Neon Badge */}
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-white shadow-lg border"
                  style={{
                    backgroundColor: `${item.badgeColor}20`,
                    borderColor: item.badgeColor,
                    color: item.badgeColor
                  }}
                >
                  {item.badge}
                </div>

                {/* Rating & Downloads */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white">
                  <span className="flex items-center gap-1 bg-[#0A0B10]/80 px-2 py-0.5 rounded-md border border-slate-800">
                    ⭐ {item.rating}
                  </span>
                  <span className="flex items-center gap-1 bg-[#0A0B10]/80 px-2 py-0.5 rounded-md border border-slate-800 text-[#00F5FF]">
                    <Download className="w-3 h-3" /> {item.downloads}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 mb-4">
                <h3 className="text-base font-extrabold text-white group-hover:text-[#00F5FF] transition-colors font-display">
                  {item.title}
                </h3>
                <p className="text-xs text-[#A0AEC0] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1E293B] text-slate-300 border border-slate-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Feature Bullets */}
              <div className="space-y-1.5 mb-5 border-t border-slate-800/80 pt-3 text-[11px] text-[#A0AEC0]">
                {item.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Interactive Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setPreviewTemplate(item)}
                  className="py-2.5 px-3 bg-[#1E293B] hover:bg-[#00F5FF] text-white hover:text-[#0A0B10] font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview
                </button>

                <button
                  onClick={() => handleCopyCode(item.id)}
                  className="py-2.5 px-3 bg-gradient-to-r from-[#00F5FF] to-[#9D4EDD] hover:from-[#00F5FF] hover:to-[#00F5A0] text-white font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-1.5"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Cloned!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* LIVE PREVIEW INTERACTIVE MODAL */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 bg-[#0A0B10]/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-[#0F172A] border border-[#00F5FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,245,255,0.2)] space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-[#1E293B] text-[#A0AEC0] hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF]">
                  {previewTemplate.category}
                </span>
                <span className="text-xs text-[#A0AEC0] font-semibold">⭐ {previewTemplate.rating} Rating</span>
                <span className="text-xs text-[#A0AEC0] font-semibold">📥 {previewTemplate.downloads} Downloads</span>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white font-display">{previewTemplate.title}</h2>
                <p className="text-sm text-[#A0AEC0] mt-1">{previewTemplate.description}</p>
              </div>

              {/* Preview Canvas Simulated Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 h-64 sm:h-80 bg-[#0A0B10]">
                <img
                  src={previewTemplate.previewImage}
                  alt={previewTemplate.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                  <div className="text-center space-y-3 p-4">
                    <Sparkles className="w-8 h-8 text-[#00F5FF] mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      Interactive Live Dashboard Sandbox Ready
                    </p>
                    <a
                      href="#/dashboard"
                      onClick={() => setPreviewTemplate(null)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00F5FF] text-[#0A0B10] font-extrabold text-xs shadow-[0_0_20px_rgba(0,245,255,0.6)] hover:bg-[#00F5A0] transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" /> Launch Live Workspace
                    </a>
                  </div>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="p-4 rounded-2xl bg-[#0A0B10] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#A0AEC0]">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#00F5FF]" /> Quick Clone Command
                  </span>
                  <button
                    onClick={() => handleCopyCode(previewTemplate.id)}
                    className="text-[#00F5FF] hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Git URL
                  </button>
                </div>
                <pre className="text-xs text-[#00F5A0] font-mono overflow-x-auto p-2 bg-[#1E293B]/50 rounded-lg">
                  git clone https://github.com/AntigravityAdmin/template-{previewTemplate.id}.git
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="pt-8 border-t border-slate-800 text-center text-xs text-[#A0AEC0] space-y-2">
          <p>© 2026 Antigravity Admin Showcase — Zero-Gravity Physics & Futuristic Design System.</p>
          <p className="text-[11px] text-slate-600">
            Powered by React 18, Vite, Tailwind CSS & Google Antigravity AI Engine.
          </p>
        </footer>
      </div>
    </div>
  );
}
