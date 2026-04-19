import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { MapPin, Mail, ExternalLink, Github, Linkedin, Twitter, Shield } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

const POLICY_LINKS = [
  {
    label: "Privacy Policy",
    content: `
      <h1>Privacy Policy</h1>
      <p>Last updated: ${CURRENT_YEAR}</p>
      <h2>1. Information We Collect</h2>
      <p>Smart Locker System collects your name, email address, phone number, and booking history to facilitate secure locker reservations across our network.</p>
      <h2>2. How We Use Your Data</h2>
      <p>Your information is used exclusively to process bookings, send OTP verifications, and manage your account. We do not sell your data to third parties.</p>
      <h2>3. Data Security</h2>
      <p>All data is encrypted in transit and at rest. Access is strictly limited to authorized personnel only.</p>
      <h2>4. Your Rights</h2>
      <p>You may request deletion or export of your personal data at any time by contacting us at rabbyjahidulislam5@gmail.com.</p>
      <h2>5. Contact</h2>
      <p>East West University, Aftabnagar, Dhaka | rabbyjahidulislam5@gmail.com</p>
    `,
  },
  {
    label: "Terms & Conditions",
    content: `
      <h1>Terms & Conditions</h1>
      <p>Last updated: ${CURRENT_YEAR}</p>
      <h2>1. Acceptance</h2>
      <p>By using Smart Locker System, you agree to these terms. Continued use constitutes acceptance of any updates.</p>
      <h2>2. Booking Policy</h2>
      <p>Bookings are confirmed via OTP verification. Cancellations within 1 hour incur a 40% fee; cancellations after key request incur an 80–100% fee.</p>
      <h2>3. Locker Usage</h2>
      <p>Users must not store illegal, hazardous, or perishable items. Overdue usage incurs additional hourly charges.</p>
      <h2>4. Liability</h2>
      <p>Smart Locker System is not liable for loss of items due to user negligence. We provide best-effort security monitoring.</p>
      <h2>5. Governing Law</h2>
      <p>These terms are governed by the laws of Bangladesh.</p>
    `,
  },
  {
    label: "FAQ",
    content: `
      <h1>Frequently Asked Questions</h1>
      <h2>How do I book a locker?</h2>
      <p>Select a station from the map, choose an available locker unit, set your duration, and verify your booking via OTP sent to your email.</p>
      <h2>What is the cancellation policy?</h2>
      <p>Cancel before key request for a 60% refund. Cancellations after key issuance receive 0–20% refund based on timing.</p>
      <h2>Can I extend my booking?</h2>
      <p>Yes! From your User Dashboard, go to Active Stays and use the extend option on any active booking.</p>
      <h2>What happens if I go over time?</h2>
      <p>Overtime charges are calculated hourly and must be settled before your final checkout.</p>
      <h2>How do I contact support?</h2>
      <p>Email us at rabbyjahidulislam5@gmail.com or visit East West University, Aftabnagar, Dhaka.</p>
    `,
  },
  {
    label: "About Us",
    content: `
      <h1>About Smart Locker System</h1>
      <p>Smart Locker System is a next-generation tourist locker management platform built for Bangladesh's growing travel and transit industry.</p>
      <h2>Our Mission</h2>
      <p>To give every traveler the freedom to explore without the burden of their luggage — through a secure, real-time, digital-first locker network.</p>
      <h2>Technology</h2>
      <p>Built with a modern React frontend, Node.js backend, PostgreSQL database, and Socket.io for real-time synchronization across all stations.</p>
      <h2>Team</h2>
      <p>Developed at East West University, Aftabnagar, Dhaka as part of a capstone systems engineering project.</p>
      <h2>Contact</h2>
      <p>rabbyjahidulislam5@gmail.com</p>
    `,
  },
];

function openPolicyPage(title: string, htmlContent: string) {
  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title} — Smart Locker System</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet"/>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --bg: #0d0e1a;
          --surface: rgba(255,255,255,0.04);
          --border: rgba(255,255,255,0.08);
          --text: #f1f5f9;
          --muted: #94a3b8;
          --radius: 1.5rem;
        }

        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--bg);
          background-image:
            radial-gradient(at 10% 10%, rgba(99,102,241,0.12) 0px, transparent 55%),
            radial-gradient(at 90% 80%, rgba(79,70,229,0.08) 0px, transparent 55%);
          background-attachment: fixed;
          min-height: 100vh;
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Navbar ── */
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(13,14,26,0.7);
          border-bottom: 1px solid var(--border);
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .nav-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1rem;
          color: white;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }
        .nav-title {
          font-weight: 900;
          font-size: 1.1rem;
          letter-spacing: -0.03em;
          background: linear-gradient(90deg, var(--primary), #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .close-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99,102,241,0.15);
          color: var(--primary);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 0.875rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .close-btn:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.35);
        }

        /* ── Hero ── */
        .hero {
          padding: 4rem 2rem 3rem;
          max-width: 820px;
          margin: 0 auto;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 999px;
          padding: 0.3rem 1rem;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a5b4fc;
          margin-bottom: 1.25rem;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hero h1 {
          font-size: clamp(2.2rem, 5vw, 3.75rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: var(--text);
          margin-bottom: 0.75rem;
        }
        .hero-sub {
          font-size: 0.9rem;
          color: var(--muted);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* ── Content card ── */
        .content {
          max-width: 820px;
          margin: 0 auto;
          padding: 0 2rem 6rem;
        }
        .card {
          background: var(--surface);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 2.5rem 2.75rem;
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
        }

        /* ── Typography inside card ── */
        .card h1 {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--text);
          margin-bottom: 0.25rem;
        }
        .card > p:first-of-type {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 500;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        h2 {
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--primary);
          margin-top: 2rem;
          margin-bottom: 0.6rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        h2::before {
          content: '';
          display: inline-block;
          width: 3px;
          height: 12px;
          background: var(--primary);
          border-radius: 2px;
          flex-shrink: 0;
        }
        p {
          color: #cbd5e1;
          line-height: 1.85;
          font-size: 0.9rem;
          font-weight: 400;
        }
        code {
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 6px;
          padding: 0.15em 0.5em;
          font-family: ui-monospace, monospace;
          font-size: 0.85em;
          color: #a5b4fc;
        }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent);
          margin: 2rem 0;
        }
      </style>
    </head>
    <body>
      <nav class="nav">
        <a class="nav-brand" href="javascript:void(0)">
          <div class="nav-icon">S</div>
          <span class="nav-title">Smart Locker System</span>
        </a>
        <button class="close-btn" onclick="window.close()">✕ Close</button>
      </nav>

      <div class="hero">
        <div class="badge"><span class="badge-dot"></span>Smart Locker System</div>
        <h1>${title}</h1>
        <p class="hero-sub">📍 East West University, Aftabnagar, Dhaka</p>
      </div>

      <div class="content">
        <div class="card">
          ${htmlContent}
          <div class="divider"></div>
          <p style="font-size:0.78rem; color:#64748b; text-align:center;">© ${CURRENT_YEAR} Smart Locker System — East West University, Dhaka</p>
        </div>
      </div>
    </body>
    </html>
  `);
  win.document.close();
}


export function Footer() {
  const [location] = useLocation();

  // Only render on Public Home and User Dashboard
  // Render everywhere except receptionist and admin screens which have their own layouts
  if (location.startsWith("/admin") || location.startsWith("/receptionist")) return null;

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative mt-auto border-t border-white/40 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-2xl"
      style={{ zIndex: 10 }}
    >
      {/* Subtle gradient accent line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container mx-auto px-6 py-12 md:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight">Smart Locker System</p>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Secure · Smart · Swift</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              Bangladesh's premier tourist locker network. Your adventures, secured.
            </p>
            <div className="h-px w-full max-w-[260px] bg-gradient-to-r from-primary/20 to-transparent" />
            <div className="space-y-1.5 max-w-[260px]">
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                Developed at{" "}
                <span className="font-black text-primary/80">East West University</span>
                {" "}· CSE Dept.
              </p>
              <p className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">
                Advanced Database — Course Project
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <span className="text-[9px] font-black text-primary">AC</span>
                </div>
                <div>
                  <a
                    href="https://fse.ewubd.edu/computer-science-engineering/faculty-view/antu.chowdhury"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-black text-primary/80 hover:text-primary transition-colors hover:underline underline-offset-2 leading-none block"
                  >
                    Antu Chowdhury
                  </a>
                  <p className="text-[10px] text-muted-foreground/50 leading-tight">
                    Lecturer · CSE, EWU
                  </p>
                </div>
              </div>
            </div>
            {/* Social placeholders */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { icon: Github, label: "GitHub" },
                { icon: Twitter, label: "Twitter" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-muted/60 hover:bg-primary hover:text-white flex items-center justify-center text-muted-foreground transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 border border-white/40 dark:border-white/10"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Column 2 — Contact */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Contact & Location</p>
            <div className="space-y-3">
              <a
                href="https://maps.google.com/?q=East+West+University+Aftabnagar+Dhaka"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-300">
                  <MapPin className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">East West University</p>
                  <p className="text-xs text-muted-foreground">Aftabnagar, Dhaka, Bangladesh</p>
                </div>
              </a>
              <a
                href="mailto:rabbyjahidulislam5@gmail.com"
                className="flex items-start gap-3 group"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-300">
                  <Mail className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Email Us</p>
                  <p className="text-xs text-muted-foreground">rabbyjahidulislam5@gmail.com</p>
                </div>
              </a>
            </div>
          </div>

          {/* Column 3 — Quick Links */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Legal & Info</p>
            <div className="flex flex-wrap gap-2">
              {POLICY_LINKS.map(({ label, content }) => (
                <button
                  key={label}
                  onClick={() => openPolicyPage(label, content)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 text-muted-foreground hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  {label}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </button>
              ))}
            </div>
            {/* Live status pill */}
            <div className="flex items-center gap-2 mt-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-green-600">All Systems Operational</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p className="font-medium">
            © {CURRENT_YEAR}{" "}
            <span className="font-black text-foreground">Smart Locker System</span>
            . All rights reserved.
          </p>
          <p className="font-medium flex items-center gap-1.5">
            Built with ❤️ at{" "}
            <a
              href="https://www.ewubd.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-primary hover:underline underline-offset-2 transition-all"
            >
              East West University
            </a>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
