"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import SubjectCard from "@/components/SubjectCard";
import { checkDeviceCapabilities, type DeviceCapabilities } from "@/lib/webgpu-check";

type Step = "grade" | "subject" | "device" | "ready";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("grade");
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
    const [checkingDevice, setCheckingDevice] = useState(false);

    const handleGradeSelect = (grade: number) => {
        setSelectedGrade(grade);
        setStep("subject");
    };

    const toggleSubject = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject)
                ? prev.filter((s) => s !== subject)
                : [...prev, subject]
        );
    };

    const handleSubjectNext = async () => {
        if (selectedSubjects.length === 0) return;
        setStep("device");
        setCheckingDevice(true);
        try {
            const caps = await checkDeviceCapabilities();
            setCapabilities(caps);
        } catch {
            setCapabilities({
                webgpuAvailable: false,
                estimatedMemoryGB: 2,
                batteryLevel: null,
                isCharging: null,
                recommendedModel: "none",
            });
        }
        setCheckingDevice(false);
    };

    const handleStart = () => {
        // Store preferences in localStorage for simplicity
        if (typeof window !== "undefined") {
            localStorage.setItem(
                "antigravity-prefs",
                JSON.stringify({
                    grade: selectedGrade,
                    subjects: selectedSubjects,
                    aiEnabled: capabilities?.recommendedModel !== "none",
                    recommendedModel: capabilities?.recommendedModel,
                })
            );
        }
        router.push("/learn");
    };

    return (
        <>
            <Navbar />
            <main className="page-content">
                <div className="container">
                    {/* Progress */}
                    <div style={{ maxWidth: 400, margin: "0 auto var(--space-xl)" }}>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width:
                                        step === "grade"
                                            ? "25%"
                                            : step === "subject"
                                                ? "50%"
                                                : step === "device"
                                                    ? "75%"
                                                    : "100%",
                                }}
                            />
                        </div>
                        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "var(--font-sm)", marginTop: "var(--space-sm)" }}>
                            Step {step === "grade" ? 1 : step === "subject" ? 2 : step === "device" ? 3 : 4} of 4
                        </p>
                    </div>

                    {/* Step: Grade */}
                    {step === "grade" && (
                        <div className="onboarding-step" style={{ animation: "fadeSlideUp 0.4s ease" }}>
                            <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                                What grade are you in? 🎒
                            </h1>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-lg)" }}>
                                We&apos;ll customize your learning journey to match your level.
                            </p>
                            <div className="grade-grid">
                                {[1, 2, 3, 4, 5, 6].map((grade) => (
                                    <button
                                        key={grade}
                                        className={`grade-btn${selectedGrade === grade ? " selected" : ""}`}
                                        onClick={() => handleGradeSelect(grade)}
                                        id={`grade-btn-${grade}`}
                                    >
                                        {grade}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step: Subject */}
                    {step === "subject" && (
                        <div className="onboarding-step" style={{ animation: "fadeSlideUp 0.4s ease" }}>
                            <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                                Pick your subjects 📚
                            </h1>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-lg)" }}>
                                Choose one or more subjects to start learning.
                            </p>
                            <div className="subject-grid" style={{ maxWidth: 500, margin: "0 auto" }}>
                                {[
                                    { id: "mathematics", icon: "📐", label: "Mathematics" },
                                    { id: "science", icon: "🔬", label: "Science" },
                                    { id: "literacy", icon: "📖", label: "Literacy" },
                                ].map((subj) => (
                                    <SubjectCard
                                        key={subj.id}
                                        subject={subj.id}
                                        icon={subj.icon}
                                        title={subj.label}
                                        selected={selectedSubjects.includes(subj.id)}
                                        onClick={() => toggleSubject(subj.id)}
                                    />
                                ))}
                            </div>
                            <div style={{ marginTop: "var(--space-xl)", display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
                                <button className="btn btn-secondary" onClick={() => setStep("grade")}>← Back</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubjectNext}
                                    disabled={selectedSubjects.length === 0}
                                    style={{ opacity: selectedSubjects.length === 0 ? 0.5 : 1 }}
                                    id="subjects-next-btn"
                                >
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Device Check */}
                    {step === "device" && (
                        <div className="onboarding-step" style={{ animation: "fadeSlideUp 0.4s ease" }}>
                            <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                                Checking your device 🔍
                            </h1>

                            {checkingDevice ? (
                                <div className="loading-screen" style={{ minHeight: "30vh" }}>
                                    <div className="spinner" />
                                    <p className="loading-text">Checking GPU, memory, and battery...</p>
                                </div>
                            ) : capabilities ? (
                                <div style={{ maxWidth: 500, margin: "var(--space-xl) auto" }}>
                                    <div className="glass-card" style={{ marginBottom: "var(--space-md)" }}>
                                        <div className="settings-row">
                                            <span>WebGPU</span>
                                            <span className={`status-badge ${capabilities.webgpuAvailable ? "status-online" : "status-offline"}`}>
                                                <span className="status-dot" />
                                                {capabilities.webgpuAvailable ? "Available" : "Not Available"}
                                            </span>
                                        </div>
                                        <div className="settings-row">
                                            <span>Estimated RAM</span>
                                            <span style={{ color: "var(--text-secondary)" }}>{capabilities.estimatedMemoryGB} GB</span>
                                        </div>
                                        <div className="settings-row">
                                            <span>Battery</span>
                                            <span style={{ color: "var(--text-secondary)" }}>
                                                {capabilities.batteryLevel !== null
                                                    ? `${Math.round(capabilities.batteryLevel * 100)}%${capabilities.isCharging ? " ⚡ Charging" : ""}`
                                                    : "Unknown"}
                                            </span>
                                        </div>
                                        <div className="settings-row" style={{ borderBottom: "none" }}>
                                            <span>Recommended AI</span>
                                            <span className={`model-badge${capabilities.recommendedModel !== "none" ? " loaded" : ""}`}>
                                                {capabilities.recommendedModel === "premium"
                                                    ? "🌟 Llama-3 8B"
                                                    : capabilities.recommendedModel === "primary"
                                                        ? "✨ Gemma 2B"
                                                        : capabilities.recommendedModel === "fallback"
                                                            ? "⚡ TinyLlama 1.1B"
                                                            : "📚 Curriculum Only"}
                                            </span>
                                        </div>
                                    </div>

                                    {capabilities.recommendedModel === "none" && (
                                        <div className="exercise-hint">
                                            <strong>No worries!</strong> AI isn&apos;t available on your device, but you&apos;ll still get the full curriculum with guided exercises and explanations.
                                        </div>
                                    )}

                                    {capabilities.recommendedModel !== "none" && (
                                        <div className="exercise-explanation">
                                            <strong>Great news!</strong> Your device supports on-device AI. The model will download (~1.3GB) on first use over WiFi.
                                        </div>
                                    )}

                                    <div style={{ marginTop: "var(--space-xl)", display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
                                        <button className="btn btn-secondary" onClick={() => setStep("subject")}>← Back</button>
                                        <button className="btn btn-primary" onClick={() => setStep("ready")} id="device-next-btn">
                                            Continue →
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Step: Ready */}
                    {step === "ready" && (
                        <div className="onboarding-step" style={{ animation: "fadeSlideUp 0.4s ease" }}>
                            <div style={{ fontSize: 72, marginBottom: "var(--space-lg)" }}>🎉</div>
                            <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                                You&apos;re all set!
                            </h1>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)", maxWidth: 400, margin: "0 auto var(--space-xl)" }}>
                                Grade {selectedGrade} · {selectedSubjects.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
                                {capabilities?.recommendedModel !== "none" ? " · AI-Powered" : " · Guided Curriculum"}
                            </p>
                            <button className="btn btn-primary btn-lg" onClick={handleStart} id="start-btn">
                                🚀 Start Learning!
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
