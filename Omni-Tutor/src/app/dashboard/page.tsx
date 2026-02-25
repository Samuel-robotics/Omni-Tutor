"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import SubjectCard from "@/components/SubjectCard";
import { getAllProgress, type LessonProgress } from "@/lib/storage";
import { LearningProfiler } from "@/lib/profiler";
import Link from "next/link";

export default function DashboardPage() {
    const [progress, setProgress] = useState<LessonProgress[]>([]);
    const [profile, setProfile] = useState<ReturnType<LearningProfiler["getProfile"]> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [allProgress, profiler] = await Promise.all([
                getAllProgress(),
                LearningProfiler.load(),
            ]);
            setProgress(allProgress);
            setProfile(profiler.getProfile());
            setLoading(false);
        }
        load();
    }, []);

    const totalCompleted = progress.filter((p) => p.completed).length;
    const avgScore = progress.length > 0
        ? Math.round(progress.reduce((sum, p) => sum + p.score, 0) / progress.length)
        : 0;
    const subjectCounts: Record<string, { completed: number; total: number; avgScore: number }> = {};

    progress.forEach((p) => {
        if (!subjectCounts[p.subject]) {
            subjectCounts[p.subject] = { completed: 0, total: 0, avgScore: 0 };
        }
        subjectCounts[p.subject].total++;
        if (p.completed) subjectCounts[p.subject].completed++;
        subjectCounts[p.subject].avgScore += p.score;
    });

    Object.values(subjectCounts).forEach((sc) => {
        sc.avgScore = sc.total > 0 ? Math.round(sc.avgScore / sc.total) : 0;
    });

    const subjectEmoji: Record<string, string> = {
        mathematics: "📐",
        science: "🔬",
        literacy: "📖",
    };

    const dominantModality = profile
        ? profile.visualScore >= profile.auditoryScore && profile.visualScore >= profile.kinestheticScore
            ? "Visual 👁️"
            : profile.auditoryScore >= profile.kinestheticScore
                ? "Auditory 👂"
                : "Kinesthetic 🤲"
        : "Unknown";

    return (
        <>
            <Navbar />
            <main className="page-content">
                <div className="container">
                    <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: "var(--space-xl)" }}>
                        Your Progress 📊
                    </h1>

                    {loading ? (
                        <div className="loading-screen" style={{ minHeight: "40vh" }}>
                            <div className="spinner" />
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="stats-grid" style={{ marginBottom: "var(--space-2xl)" }}>
                                <div className="glass-card stat-card">
                                    <div className="stat-value">{totalCompleted}</div>
                                    <div className="stat-label">Exercises Done</div>
                                </div>
                                <div className="glass-card stat-card">
                                    <div className="stat-value">{avgScore}%</div>
                                    <div className="stat-label">Average Score</div>
                                </div>
                                <div className="glass-card stat-card">
                                    <div className="stat-value">{profile?.totalInteractions || 0}</div>
                                    <div className="stat-label">Total Interactions</div>
                                </div>
                                <div className="glass-card stat-card">
                                    <div className="stat-value" style={{ fontSize: "var(--font-xl)" }}>{dominantModality}</div>
                                    <div className="stat-label">Learning Style</div>
                                </div>
                            </div>

                            {/* Subject Breakdown */}
                            <h2 style={{ fontSize: "var(--font-2xl)", fontWeight: 700, marginBottom: "var(--space-lg)" }}>
                                By Subject
                            </h2>

                            {Object.keys(subjectCounts).length === 0 ? (
                                <div className="glass-card" style={{ textAlign: "center", padding: "var(--space-3xl)" }}>
                                    <span style={{ fontSize: 48 }}>🌟</span>
                                    <h3 style={{ marginTop: "var(--space-md)", fontWeight: 600 }}>No progress yet</h3>
                                    <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-sm)" }}>
                                        Start a lesson to track your progress!
                                    </p>
                                    <Link href="/learn" className="btn btn-primary" style={{ marginTop: "var(--space-lg)", display: "inline-flex" }}>
                                        🚀 Start Learning
                                    </Link>
                                </div>
                            ) : (
                                <div className="subject-grid">
                                    {Object.entries(subjectCounts).map(([subj, data]) => (
                                        <SubjectCard
                                            key={subj}
                                            subject={subj}
                                            icon={subjectEmoji[subj] || "📚"}
                                            title={subj}
                                            stats={data}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Learning Profile */}
                            {profile && profile.totalInteractions > 0 && (
                                <div style={{ marginTop: "var(--space-2xl)" }}>
                                    <h2 style={{ fontSize: "var(--font-2xl)", fontWeight: 700, marginBottom: "var(--space-lg)" }}>
                                        Learning Profile 🧠
                                    </h2>
                                    <div className="glass-card">
                                        <div className="settings-row">
                                            <span>Reading Level</span>
                                            <span className="model-badge" style={{ textTransform: "capitalize" }}>{profile.readingLevel}</span>
                                        </div>
                                        <div className="settings-row">
                                            <span>Visual Learning</span>
                                            <span>{Math.round(profile.visualScore * 100)}%</span>
                                        </div>
                                        <div className="settings-row">
                                            <span>Auditory Learning</span>
                                            <span>{Math.round(profile.auditoryScore * 100)}%</span>
                                        </div>
                                        <div className="settings-row" style={{ borderBottom: "none" }}>
                                            <span>Kinesthetic Learning</span>
                                            <span>{Math.round(profile.kinestheticScore * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
