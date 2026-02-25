"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { loadSettings, saveSettings, exportAllData, importData, clearAllData, type AppSettings } from "@/lib/storage";
import { getTutor } from "@/lib/tutor-engine";

export default function SettingsPage() {
    const [settings, setSettings] = useState<AppSettings>({
        wifiOnly: true,
        batteryThreshold: 0.2,
        selectedModel: "primary",
        theme: "dark",
    });
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [modelStatus, setModelStatus] = useState(getTutor().modelLoaded ? "Loaded" : "Not loaded");
    const [modelProgress, setModelProgress] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadSettings().then((s) => {
            setSettings(s);
            setLoading(false);
        });
    }, []);

    const handleChange = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        await saveSettings(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleLoadModel = async () => {
        setModelStatus("Downloading...");
        const tutor = getTutor();
        tutor.setProgressCallback((report) => {
            setModelProgress(report.progress);
            setModelStatus(report.text);
        });
        try {
            await tutor.initialize(settings.selectedModel);
            setModelStatus("Loaded ✓");
        } catch {
            setModelStatus("Failed to load");
        }
    };

    const handleUnloadModel = async () => {
        await getTutor().destroy();
        setModelStatus("Not loaded");
        setModelProgress(0);
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const json = await exportAllData();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `antigravity-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
            await importData(text);
            alert("Data imported successfully! Refreshing...");
            window.location.reload();
        } catch {
            alert("Failed to import data. Please check the file format.");
        }
    };

    const handleClearAll = async () => {
        await clearAllData();
        setConfirmClear(false);
        alert("All data cleared! Refreshing...");
        window.location.reload();
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="page-content">
                    <div className="loading-screen"><div className="spinner" /></div>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="page-content">
                <div className="container" style={{ maxWidth: 700 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-xl)" }}>
                        <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700 }}>Settings ⚙️</h1>
                        {saved && (
                            <span className="status-badge status-online" style={{ animation: "fadeSlideUp 0.3s ease" }}>
                                <span className="status-dot" /> Saved
                            </span>
                        )}
                    </div>

                    {/* AI Model */}
                    <div className="glass-card settings-group">
                        <h2 className="settings-group-title">🤖 AI Model</h2>

                        <div className="settings-row">
                            <div>
                                <div className="settings-label">Model Selection</div>
                                <div className="settings-desc">Choose the AI model size based on your device</div>
                            </div>
                            <select
                                className="input"
                                style={{ width: 180 }}
                                value={settings.selectedModel}
                                onChange={(e) => handleChange("selectedModel", e.target.value as AppSettings["selectedModel"])}
                                id="model-selector"
                            >
                                <option value="primary">✨ Gemma 2B (1.3GB)</option>
                                <option value="premium">🌟 Llama-3 8B (4GB)</option>
                                <option value="fallback">⚡ TinyLlama 1.1B (0.6GB)</option>
                            </select>
                        </div>

                        <div className="settings-row">
                            <div>
                                <div className="settings-label">Model Status</div>
                                <div className="settings-desc">{modelStatus}</div>
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                                {!getTutor().modelLoaded ? (
                                    <button className="btn btn-sm btn-primary" onClick={handleLoadModel} id="load-model-btn">
                                        Download & Load
                                    </button>
                                ) : (
                                    <button className="btn btn-sm btn-danger" onClick={handleUnloadModel} id="unload-model-btn">
                                        Unload
                                    </button>
                                )}
                            </div>
                        </div>

                        {modelProgress > 0 && modelProgress < 1 && (
                            <div style={{ marginTop: "var(--space-sm)" }}>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${modelProgress * 100}%` }} />
                                </div>
                                <p style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)", marginTop: 4 }}>
                                    {Math.round(modelProgress * 100)}%
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Download Preferences */}
                    <div className="glass-card settings-group">
                        <h2 className="settings-group-title">📡 Connectivity</h2>

                        <div className="settings-row">
                            <div>
                                <div className="settings-label">WiFi-Only Downloads</div>
                                <div className="settings-desc">Only download AI models when connected to WiFi</div>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={settings.wifiOnly}
                                    onChange={(e) => handleChange("wifiOnly", e.target.checked)}
                                    id="wifi-only-toggle"
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>

                        <div className="settings-row" style={{ borderBottom: "none" }}>
                            <div>
                                <div className="settings-label">Battery Threshold</div>
                                <div className="settings-desc">
                                    Pause AI inference below {Math.round(settings.batteryThreshold * 100)}% battery
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0.05"
                                max="0.5"
                                step="0.05"
                                value={settings.batteryThreshold}
                                onChange={(e) => handleChange("batteryThreshold", parseFloat(e.target.value))}
                                style={{ width: 120, accentColor: "var(--accent-primary)" }}
                                id="battery-threshold-slider"
                            />
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="glass-card settings-group">
                        <h2 className="settings-group-title">💾 Data Management</h2>

                        <div className="settings-row">
                            <div>
                                <div className="settings-label">Export Data</div>
                                <div className="settings-desc">Download your progress and settings as JSON</div>
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={handleExport} disabled={exporting} id="export-btn">
                                {exporting ? "Exporting..." : "📥 Export"}
                            </button>
                        </div>

                        <div className="settings-row">
                            <div>
                                <div className="settings-label">Import Data</div>
                                <div className="settings-desc">Restore from a previous backup</div>
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
                                    id="import-file-input"
                                />
                                <button className="btn btn-sm btn-secondary" onClick={() => fileInputRef.current?.click()} id="import-btn">
                                    📤 Import
                                </button>
                            </div>
                        </div>

                        <div className="settings-row" style={{ borderBottom: "none" }}>
                            <div>
                                <div className="settings-label" style={{ color: "var(--error)" }}>Clear All Data</div>
                                <div className="settings-desc">Delete all progress, settings, and cached data</div>
                            </div>
                            {!confirmClear ? (
                                <button className="btn btn-sm btn-danger" onClick={() => setConfirmClear(true)} id="clear-data-btn">
                                    🗑️ Clear
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setConfirmClear(false)}>Cancel</button>
                                    <button className="btn btn-sm btn-danger" onClick={handleClearAll} id="confirm-clear-btn">
                                        Confirm Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* About */}
                    <div className="glass-card" style={{ textAlign: "center", padding: "var(--space-xl)" }}>
                        <h2 style={{ fontSize: "var(--font-lg)", fontWeight: 700, marginBottom: "var(--space-sm)" }}>
                            🚀 Omni-Tutor
                        </h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                            v1.0.0 · AI-Powered Adaptive Learning
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)", marginTop: "var(--space-sm)" }}>
                            100% local · Zero data collection · GDPR compliant by design
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
