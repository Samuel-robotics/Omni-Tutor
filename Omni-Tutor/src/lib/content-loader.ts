import { cacheCurriculum, getCachedCurriculum } from "./storage";

export interface Lesson {
    id: string;
    title: string;
    objective: string;
    content: string;
    exercises: Exercise[];
    difficulty: "easy" | "medium" | "hard";
}

export interface Exercise {
    id: string;
    type: "multiple-choice" | "fill-in" | "open-ended";
    question: string;
    options?: string[];
    correctAnswer: string;
    hint?: string;
    explanation: string;
}

export interface CurriculumData {
    subject: string;
    grade: number;
    title: string;
    description: string;
    lessons: Lesson[];
}

const CDN_BASE =
    typeof window !== "undefined" ? window.location.origin : "";

export async function loadCurriculum(
    subject: string,
    grade: number
): Promise<CurriculumData | null> {
    // 1. Check IndexedDB cache first
    const cached = await getCachedCurriculum(subject, grade);
    if (cached) return cached as CurriculumData;

    // 2. Fetch from local / CDN
    try {
        const response = await fetch(
            `${CDN_BASE}/curriculum/${subject}/grade-${grade}.json`
        );
        if (!response.ok) return null;

        const data: CurriculumData = await response.json();

        // 3. Cache for offline use
        await cacheCurriculum(subject, grade, data);

        return data;
    } catch {
        return null;
    }
}

export async function loadContentIndex(): Promise<
    { subject: string; grades: number[]; title: string }[] | null
> {
    try {
        const response = await fetch(`${CDN_BASE}/curriculum/content-index.json`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}
