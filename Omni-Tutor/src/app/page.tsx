"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="page-content">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />

          <div className="container" style={{ position: "relative", zIndex: 1 }}>
            <h1 className="hero-title">
              Learn Without<br />Limits
            </h1>
            <p className="hero-subtitle">
              AI-powered tutoring that runs entirely on your device.
              No internet needed. No data collected. No cost — ever.
            </p>
            <div className="hero-cta">
              <Link href="/onboarding" className="btn btn-primary btn-lg" id="start-learning-btn">
                🚀 Start Learning
              </Link>
              <Link href="/learn" className="btn btn-secondary btn-lg" id="browse-lessons-btn">
                📚 Browse Lessons
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container">
          <div className="feature-grid">
            <div className="glass-card feature-card">
              <span className="feature-icon">🧠</span>
              <h3 className="feature-title">AI Tutor On-Device</h3>
              <p className="feature-desc">
                Powered by WebLLM, the AI runs directly in your browser using your device&apos;s GPU. No server, no latency, no data leaving your phone.
              </p>
            </div>

            <div className="glass-card feature-card">
              <span className="feature-icon">📡</span>
              <h3 className="feature-title">Works Offline</h3>
              <p className="feature-desc">
                Download the AI model once on WiFi, then learn anywhere — on the bus, in rural areas, or during outages. No internet required.
              </p>
            </div>

            <div className="glass-card feature-card">
              <span className="feature-icon">🎯</span>
              <h3 className="feature-title">Adaptive Learning</h3>
              <p className="feature-desc">
                The tutor learns your strengths and weaknesses in real-time, adjusting explanations, examples, and difficulty to match your pace.
              </p>
            </div>

            <div className="glass-card feature-card">
              <span className="feature-icon">🔒</span>
              <h3 className="feature-title">100% Private</h3>
              <p className="feature-desc">
                Your learning data never leaves your device. No accounts needed. No tracking. GDPR/CCPA compliant by design.
              </p>
            </div>

            <div className="glass-card feature-card">
              <span className="feature-icon">💰</span>
              <h3 className="feature-title">Completely Free</h3>
              <p className="feature-desc">
                £0 to use, £0 to host, £0 AI costs. We use static hosting and local inference to deliver premium education at zero cost.
              </p>
            </div>

            <div className="glass-card feature-card">
              <span className="feature-icon">🌍</span>
              <h3 className="feature-title">Universal Access</h3>
              <p className="feature-desc">
                From flagship phones to budget £100 Androids. If your device can&apos;t run AI, you still get full curriculum access with guided exercises.
              </p>
            </div>
          </div>
        </section>

        {/* Subjects Preview */}
        <section className="container" style={{ marginTop: "var(--space-3xl)" }}>
          <h2 style={{
            fontSize: "var(--font-3xl)",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "var(--space-xl)"
          }}>
            Explore Subjects
          </h2>
          <div className="subject-grid">
            <Link href="/learn?subject=mathematics" style={{ textDecoration: "none" }}>
              <div className="subject-card math" id="subject-math">
                <div className="subject-icon">📐</div>
                <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                  Mathematics
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                  Counting, arithmetic, fractions, geometry — from Grade 1 to Grade 6.
                </p>
              </div>
            </Link>

            <Link href="/learn?subject=science" style={{ textDecoration: "none" }}>
              <div className="subject-card science" id="subject-science">
                <div className="subject-icon">🔬</div>
                <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                  Science
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                  Nature, energy, the human body, experiments — hands-on discovery.
                </p>
              </div>
            </Link>

            <Link href="/learn?subject=literacy" style={{ textDecoration: "none" }}>
              <div className="subject-card literacy" id="subject-literacy">
                <div className="subject-icon">📖</div>
                <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                  Literacy
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                  Reading, writing, phonics, comprehension — build strong language skills.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          padding: "var(--space-3xl) 0 var(--space-xl)",
          color: "var(--text-muted)",
          fontSize: "var(--font-sm)"
        }}>
          <p>Built with 💜 by the Omni-Tutor team</p>
          <p style={{ marginTop: "var(--space-xs)" }}>
            Powered by WebLLM · Offline-First · Open Education
          </p>
        </footer>
      </main>
    </>
  );
}
