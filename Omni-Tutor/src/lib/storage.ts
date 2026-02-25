import { get, set, del, keys } from "idb-keyval";
import type { LearnerProfile } from "./profiler";

// ─── Profile ────────────────────────────────
export async function saveProfile(profile: LearnerProfile): Promise<void> {
    await set("learner-profile", profile);
}

export async function loadProfile(): Promise<LearnerProfile | null> {
    return (await get("learner-profile")) || null;
}

// ─── Progress Tracking ──────────────────────
export interface LessonProgress {
    subject: string;
    grade: number;
    lessonId: string;
    completed: boolean;
    score: number;
    timestamp: string;
}

export async function saveLessonProgress(
    progress: LessonProgress
): Promise<void> {
    const key = `progress-${progress.subject}-${progress.grade}-${progress.lessonId}`;
    await set(key, progress);
}

export async function getProgressForSubject(
    subject: string,
    grade: number
): Promise<LessonProgress[]> {
    const prefix = `progress-${subject}-${grade}`;
    const allKeys = await keys();
    const matching = allKeys.filter(
        (k) => typeof k === "string" && k.startsWith(prefix)
    );

    const results: LessonProgress[] = [];
    for (const key of matching) {
        const value = await get(key);
        if (value) results.push(value as LessonProgress);
    }

    return results;
}

export async function getAllProgress(): Promise<LessonProgress[]> {
    const allKeys = await keys();
    const matching = allKeys.filter(
        (k) => typeof k === "string" && (k as string).startsWith("progress-")
    );

    const results: LessonProgress[] = [];
    for (const key of matching) {
        const value = await get(key);
        if (value) results.push(value as LessonProgress);
    }

    return results;
}

// ─── Curriculum Cache ───────────────────────
export async function cacheCurriculum(
    subject: string,
    grade: number,
    data: unknown
): Promise<void> {
    const key = `curriculum-${subject}-${grade}`;
    await set(key, data);
}

export async function getCachedCurriculum(
    subject: string,
    grade: number
): Promise<unknown | null> {
    const key = `curriculum-${subject}-${grade}`;
    return (await get(key)) || null;
}

// ─── Settings ───────────────────────────────
export interface AppSettings {
    wifiOnly: boolean;
    batteryThreshold: number;
    selectedModel: "primary" | "premium" | "fallback";
    theme: "dark" | "light";
}

const DEFAULT_SETTINGS: AppSettings = {
    wifiOnly: true,
    batteryThreshold: 0.2,
    selectedModel: "primary",
    theme: "dark",
};

export async function saveSettings(settings: AppSettings): Promise<void> {
    await set("app-settings", settings);
}

export async function loadSettings(): Promise<AppSettings> {
    return ((await get("app-settings")) as AppSettings) || { ...DEFAULT_SETTINGS };
}

// ─── Data Export / Import ───────────────────
export async function exportAllData(): Promise<string> {
    const profile = await loadProfile();
    const progress = await getAllProgress();
    const settings = await loadSettings();

    return JSON.stringify({ profile, progress, settings, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    if (data.profile) await saveProfile(data.profile);
    if (data.settings) await saveSettings(data.settings);
    if (data.progress) {
        for (const p of data.progress) {
            await saveLessonProgress(p);
        }
    }
}

// ─── Clear Data ─────────────────────────────
export async function clearAllData(): Promise<void> {
    const allKeys = await keys();
    for (const key of allKeys) {
        await del(key);
    }
}
