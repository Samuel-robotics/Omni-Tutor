"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatBubble from "@/components/ChatBubble";
import ProgressBar from "@/components/ProgressBar";
import ModelStatus from "@/components/ModelStatus";
import BatteryWarning from "@/components/BatteryWarning";
import { loadCurriculum, type CurriculumData, type Lesson, type Exercise } from "@/lib/content-loader";
import { getTutor } from "@/lib/tutor-engine";
import { LearningProfiler } from "@/lib/profiler";
import { saveLessonProgress } from "@/lib/storage";
import { checkDeviceCapabilities, shouldPauseInference } from "@/lib/webgpu-check";

interface ChatMessage {
    role: "ai" | "user" | "system";
    content: string;
}

function LearnContent() {
    const searchParams = useSearchParams();
    const initialSubject = searchParams.get("subject") || "";

    const [subject, setSubject] = useState(initialSubject || "mathematics");
    const [grade, setGrade] = useState(1);
    const [curriculum, setCurriculum] = useState<CurriculumData | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
    const [answered, setAnswered] = useState<Record<string, string>>({});
    const [showHint, setShowHint] = useState<Record<string, boolean>>({});
    const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
    const [fillInAnswer, setFillInAnswer] = useState("");

    // AI Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(false);
    const [modelStatus, setModelStatus] = useState("Not loaded");
    const [modelProgress, setModelProgress] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [batteryWarning, setBatteryWarning] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const profilerRef = useRef<LearningProfiler | null>(null);

    // Load preferences
    useEffect(() => {
        if (typeof window !== "undefined") {
            const prefs = localStorage.getItem("antigravity-prefs");
            if (prefs) {
                const p = JSON.parse(prefs);
                if (p.grade) setGrade(p.grade);
                if (p.subjects?.length > 0 && !initialSubject) setSubject(p.subjects[0]);
            }
        }
    }, [initialSubject]);

    // Load profiler
    useEffect(() => {
        LearningProfiler.load().then((p) => {
            profilerRef.current = p;
        });
    }, []);

    // Load curriculum
    useEffect(() => {
        loadCurriculum(subject, grade).then((data) => {
            setCurriculum(data);
            if (data?.lessons?.[0]) {
                setCurrentLesson(data.lessons[0]);
                setCurrentExerciseIdx(0);
                setAnswered({});
                setShowHint({});
                setShowExplanation({});
            }
        });
    }, [subject, grade]);

    // Scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // Check AI availability
    useEffect(() => {
        checkDeviceCapabilities().then((caps) => {
            setAiAvailable(caps.webgpuAvailable);
            if (caps.batteryLevel !== null && shouldPauseInference(caps.batteryLevel, caps.isCharging)) {
                setBatteryWarning(true);
            }
        });
    }, []);

    const handleLoadAI = useCallback(async () => {
        setModelStatus("Downloading...");
        const tutor = getTutor();
        tutor.setProgressCallback((report) => {
            setModelProgress(report.progress);
            setModelStatus(report.text);
        });
        try {
            await tutor.initialize();
            setModelStatus("Ready ✓");
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "system",
                    content: `AI Tutor loaded (${tutor.currentModel}). Ask me anything about your lesson!`,
                },
            ]);
        } catch {
            setModelStatus("Failed to load");
            setChatMessages((prev) => [
                ...prev,
                { role: "system", content: "AI model couldn't load. Using guided curriculum instead." },
            ]);
        }
    }, []);

    const handleSendChat = useCallback(async () => {
        if (!chatInput.trim() || isAiLoading) return;
        const userMsg = chatInput.trim();
        setChatInput("");
        setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setIsAiLoading(true);

        const tutor = getTutor();
        if (!tutor.modelLoaded) {
            setChatMessages((prev) => [
                ...prev,
                { role: "ai", content: "Please load the AI model first using the button above, or I can help with guided exercises!" },
            ]);
            setIsAiLoading(false);
            return;
        }

        const systemPrompt =
            profilerRef.current?.generateSystemPrompt() ||
            "You are a helpful, encouraging tutor. Keep answers simple and age-appropriate.";

        const context = currentLesson
            ? `${systemPrompt}\n\nCurrent lesson: ${currentLesson.title}\nObjective: ${currentLesson.objective}\nContent: ${currentLesson.content}`
            : systemPrompt;

        try {
            setChatMessages((prev) => [...prev, { role: "ai", content: "" }]);
            await tutor.generateResponse(userMsg, context, (text) => {
                setChatMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "ai", content: text };
                    return updated;
                });
            });
        } catch {
            setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "ai",
                    content: "Sorry, I had trouble generating a response. Please try again!",
                };
                return updated;
            });
        }
        setIsAiLoading(false);
    }, [chatInput, isAiLoading, currentLesson]);

    const handleAnswerExercise = (exercise: Exercise, answer: string) => {
        if (answered[exercise.id]) return;

        const isCorrect = answer.trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();
        setAnswered((prev) => ({ ...prev, [exercise.id]: answer }));
        setShowExplanation((prev) => ({ ...prev, [exercise.id]: true }));

        // Record interaction
        profilerRef.current?.recordInteraction(
            currentLesson?.title || "unknown",
            isCorrect,
            "visual"
        );

        // Save progress
        if (currentLesson) {
            saveLessonProgress({
                subject,
                grade,
                lessonId: currentLesson.id,
                completed: true,
                score: isCorrect ? 100 : 0,
                timestamp: new Date().toISOString(),
            });
        }
    };

    const handleFillInSubmit = (exercise: Exercise) => {
        handleAnswerExercise(exercise, fillInAnswer);
        setFillInAnswer("");
    };

    const exercises = currentLesson?.exercises || [];
    const currentExercise = exercises[currentExerciseIdx];

    return (
        <>
            <Navbar />
            <main className="page-content">
                <div className="container">
                    {/* Subject & Grade selectors */}
                    <div style={{ display: "flex", gap: "var(--space-md)", marginBottom: "var(--space-xl)", flexWrap: "wrap", alignItems: "center" }}>
                        <select
                            className="input"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            style={{ maxWidth: 200 }}
                            id="subject-selector"
                        >
                            <option value="mathematics">📐 Mathematics</option>
                            <option value="science">🔬 Science</option>
                            <option value="literacy">📖 Literacy</option>
                        </select>
                        <select
                            className="input"
                            value={grade}
                            onChange={(e) => setGrade(Number(e.target.value))}
                            style={{ maxWidth: 150 }}
                            id="grade-selector"
                        >
                            {[1, 2, 3, 4, 5, 6].map((g) => (
                                <option key={g} value={g}>Grade {g}</option>
                            ))}
                        </select>

                        <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                            <ModelStatus
                                status={modelStatus}
                                isLoaded={modelStatus.includes("Ready")}
                                modelName={getTutor().currentModel}
                            />
                            {aiAvailable && !getTutor().modelLoaded && (
                                <button className="btn btn-sm btn-primary" onClick={handleLoadAI} id="load-ai-btn">
                                    Load AI
                                </button>
                            )}
                            <button
                                className={`btn btn-sm ${showChat ? "btn-primary" : "btn-secondary"}`}
                                onClick={() => setShowChat(!showChat)}
                                id="toggle-chat-btn"
                            >
                                💬 {showChat ? "Hide Chat" : "AI Chat"}
                            </button>
                        </div>
                    </div>

                    {/* AI Model Progress */}
                    {modelProgress > 0 && modelProgress < 1 && (
                        <div style={{ marginBottom: "var(--space-lg)" }}>
                            <ProgressBar
                                value={modelProgress}
                                label={modelStatus}
                                height={6}
                                showLabel
                            />
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: showChat ? "1fr 380px" : "1fr", gap: "var(--space-lg)" }}>
                        {/* Main Content */}
                        <div>
                            {!curriculum ? (
                                <div className="loading-screen" style={{ minHeight: "40vh" }}>
                                    <div className="spinner" />
                                    <p className="loading-text">Loading curriculum...</p>
                                </div>
                            ) : !currentLesson ? (
                                <div className="glass-card" style={{ textAlign: "center", padding: "var(--space-3xl)" }}>
                                    <span style={{ fontSize: 48 }}>📚</span>
                                    <h2 style={{ marginTop: "var(--space-md)" }}>No lessons available yet</h2>
                                    <p style={{ color: "var(--text-secondary)" }}>Try selecting a different grade or subject.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Lesson Nav */}
                                    <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)", flexWrap: "wrap" }}>
                                        {curriculum.lessons.map((lesson, i) => (
                                            <button
                                                key={lesson.id}
                                                className={`btn btn-sm ${currentLesson.id === lesson.id ? "btn-primary" : "btn-secondary"}`}
                                                onClick={() => {
                                                    setCurrentLesson(lesson);
                                                    setCurrentExerciseIdx(0);
                                                    setAnswered({});
                                                    setShowHint({});
                                                    setShowExplanation({});
                                                }}
                                            >
                                                {i + 1}. {lesson.title}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Lesson Content */}
                                    <div className="lesson-header">
                                        <h1 className="lesson-title">{currentLesson.title}</h1>
                                        <p className="lesson-objective">{currentLesson.objective}</p>
                                    </div>

                                    <div className="lesson-content">{currentLesson.content}</div>

                                    {/* Exercises */}
                                    <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 700, marginBottom: "var(--space-md)" }}>
                                        Exercises ({currentExerciseIdx + 1}/{exercises.length})
                                    </h2>

                                    {currentExercise && (
                                        <div className="glass-card exercise-card" key={currentExercise.id}>
                                            <p className="exercise-question">{currentExercise.question}</p>

                                            {currentExercise.type === "multiple-choice" && currentExercise.options && (
                                                <div className="exercise-options">
                                                    {currentExercise.options.map((opt) => {
                                                        const isAnswered = !!answered[currentExercise.id];
                                                        const isSelected = answered[currentExercise.id] === opt;
                                                        const isCorrect = opt === currentExercise.correctAnswer;
                                                        let cls = "exercise-option";
                                                        if (isAnswered && isSelected && isCorrect) cls += " correct";
                                                        else if (isAnswered && isSelected && !isCorrect) cls += " incorrect";
                                                        else if (isAnswered && isCorrect) cls += " correct";
                                                        if (isAnswered) cls += " disabled";

                                                        return (
                                                            <button
                                                                key={opt}
                                                                className={cls}
                                                                onClick={() => handleAnswerExercise(currentExercise, opt)}
                                                                id={`option-${opt.replace(/\s/g, "-")}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {currentExercise.type === "fill-in" && !answered[currentExercise.id] && (
                                                <div className="fill-in-input">
                                                    <input
                                                        className="input"
                                                        value={fillInAnswer}
                                                        onChange={(e) => setFillInAnswer(e.target.value)}
                                                        placeholder="Type your answer..."
                                                        onKeyDown={(e) => e.key === "Enter" && handleFillInSubmit(currentExercise)}
                                                        id="fill-in-input"
                                                    />
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleFillInSubmit(currentExercise)}
                                                        id="fill-in-submit"
                                                    >
                                                        Check
                                                    </button>
                                                </div>
                                            )}

                                            {currentExercise.type === "fill-in" && answered[currentExercise.id] && (
                                                <p style={{ marginTop: "var(--space-md)", fontWeight: 600 }}>
                                                    Your answer: <span style={{
                                                        color: answered[currentExercise.id].toLowerCase() === currentExercise.correctAnswer.toLowerCase()
                                                            ? "var(--success)" : "var(--error)"
                                                    }}>
                                                        {answered[currentExercise.id]}
                                                    </span>
                                                    {answered[currentExercise.id].toLowerCase() !== currentExercise.correctAnswer.toLowerCase() && (
                                                        <span style={{ color: "var(--success)", marginLeft: "var(--space-sm)" }}>
                                                            (Correct: {currentExercise.correctAnswer})
                                                        </span>
                                                    )}
                                                </p>
                                            )}

                                            {!answered[currentExercise.id] && currentExercise.hint && (
                                                <div style={{ marginTop: "var(--space-md)" }}>
                                                    {!showHint[currentExercise.id] ? (
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => setShowHint((prev) => ({ ...prev, [currentExercise.id]: true }))}
                                                        >
                                                            💡 Show Hint
                                                        </button>
                                                    ) : (
                                                        <div className="exercise-hint">💡 {currentExercise.hint}</div>
                                                    )}
                                                </div>
                                            )}

                                            {showExplanation[currentExercise.id] && (
                                                <div className="exercise-explanation">✅ {currentExercise.explanation}</div>
                                            )}

                                            {/* Exercise Nav */}
                                            <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-lg)", justifyContent: "space-between" }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    disabled={currentExerciseIdx === 0}
                                                    onClick={() => setCurrentExerciseIdx((i) => i - 1)}
                                                    style={{ opacity: currentExerciseIdx === 0 ? 0.4 : 1 }}
                                                >
                                                    ← Previous
                                                </button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    disabled={currentExerciseIdx >= exercises.length - 1}
                                                    onClick={() => {
                                                        setCurrentExerciseIdx((i) => i + 1);
                                                        setFillInAnswer("");
                                                    }}
                                                    style={{ opacity: currentExerciseIdx >= exercises.length - 1 ? 0.4 : 1 }}
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* AI Chat Panel */}
                        {showChat && (
                            <div className="glass-card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", position: "sticky", top: 88 }}>
                                <h3 style={{ fontSize: "var(--font-lg)", fontWeight: 700, marginBottom: "var(--space-md)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                                    🤖 AI Tutor
                                    <ModelStatus
                                        status={getTutor().modelLoaded ? "Active" : "Inactive"}
                                        isLoaded={getTutor().modelLoaded}
                                    />
                                </h3>

                                <div className="chat-container" style={{ flex: 1, overflowY: "auto", padding: "var(--space-sm) 0" }}>
                                    {chatMessages.length === 0 && (
                                        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "var(--space-xl) 0" }}>
                                            <span style={{ fontSize: 32 }}>💬</span>
                                            <p style={{ marginTop: "var(--space-sm)", fontSize: "var(--font-sm)" }}>
                                                {aiAvailable
                                                    ? "Load the AI model to start chatting, or ask about the lesson!"
                                                    : "AI chat requires WebGPU. Use the guided exercises instead!"}
                                            </p>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, i) => (
                                        <ChatBubble
                                            key={i}
                                            role={msg.role}
                                            content={msg.content}
                                            isLoading={isAiLoading && i === chatMessages.length - 1 && !msg.content}
                                        />
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
                                    <input
                                        className="input"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask the tutor..."
                                        onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                                        id="chat-input"
                                    />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleSendChat}
                                        disabled={isAiLoading}
                                        id="send-chat-btn"
                                    >
                                        {isAiLoading ? "..." : "Send"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Battery Warning */}
                <BatteryWarning
                    visible={batteryWarning}
                    onDismiss={() => setBatteryWarning(false)}
                />
            </main>
        </>
    );
}

export default function LearnPage() {
    return (
        <Suspense fallback={
            <div className="loading-screen">
                <div className="spinner" />
                <p className="loading-text">Loading...</p>
            </div>
        }>
            <LearnContent />
        </Suspense>
    );
}
