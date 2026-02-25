import { saveProfile, loadProfile } from "./storage";

export interface LearnerProfile {
    visualScore: number;
    auditoryScore: number;
    kinestheticScore: number;
    readingLevel: "basic" | "intermediate" | "advanced";
    failurePatterns: Record<string, number>;
    preferredAnalogies: string[];
    totalInteractions: number;
    lastActivity: string; // ISO date
}

const DEFAULT_PROFILE: LearnerProfile = {
    visualScore: 0.33,
    auditoryScore: 0.33,
    kinestheticScore: 0.34,
    readingLevel: "basic",
    failurePatterns: {},
    preferredAnalogies: [],
    totalInteractions: 0,
    lastActivity: new Date().toISOString(),
};

type Domain = "math" | "science" | "language";

const DOMAIN_ADAPTATIONS: Record<Domain, string> = {
    math: "Use concrete objects, step-by-step visual breakdown, and real-world shopping examples",
    science:
        "Use nature analogies, household experiments, and cause-effect diagrams",
    language:
        "Use phonetic breakdowns, rhyming mnemonics, and comic strip formats",
};

export class LearningProfiler {
    private profile: LearnerProfile;

    constructor(existingProfile?: LearnerProfile) {
        this.profile = existingProfile || { ...DEFAULT_PROFILE };
    }

    static async load(): Promise<LearningProfiler> {
        const saved = await loadProfile();
        return new LearningProfiler(saved || undefined);
    }

    getProfile(): LearnerProfile {
        return { ...this.profile };
    }

    recordInteraction(
        concept: string,
        success: boolean,
        modality: "visual" | "auditory" | "kinesthetic"
    ) {
        this.profile.totalInteractions++;
        this.profile.lastActivity = new Date().toISOString();

        if (!success) {
            const failures = (this.profile.failurePatterns[concept] || 0) + 1;
            this.profile.failurePatterns[concept] = failures;

            // Trigger adaptation after 3 failures
            if (failures >= 3) {
                this.adaptTeachingStrategy(concept);
            }
        }

        this.updateModalityScore(modality, success);
        this.persist();
    }

    private updateModalityScore(
        modality: "visual" | "auditory" | "kinesthetic",
        success: boolean
    ) {
        const boost = success ? 0.05 : -0.02;
        const key = `${modality}Score` as keyof Pick<
            LearnerProfile,
            "visualScore" | "auditoryScore" | "kinestheticScore"
        >;
        this.profile[key] = Math.max(0, Math.min(1, this.profile[key] + boost));

        // Normalize scores to sum to 1
        const total =
            this.profile.visualScore +
            this.profile.auditoryScore +
            this.profile.kinestheticScore;
        if (total > 0) {
            this.profile.visualScore /= total;
            this.profile.auditoryScore /= total;
            this.profile.kinestheticScore /= total;
        }
    }

    private detectDomain(concept: string): Domain {
        const lower = concept.toLowerCase();
        if (
            /addition|subtract|multipl|divid|fraction|algebra|geometry|number/.test(
                lower
            )
        )
            return "math";
        if (
            /plant|animal|energy|force|gravity|chemical|biology|physics/.test(lower)
        )
            return "science";
        return "language";
    }

    private adaptTeachingStrategy(concept: string) {
        const domain = this.detectDomain(concept);
        const adaptation = DOMAIN_ADAPTATIONS[domain];

        if (!this.profile.preferredAnalogies.includes(adaptation)) {
            this.profile.preferredAnalogies.push(adaptation);
        }

        // Upgrade reading level based on total interactions
        if (this.profile.totalInteractions > 100) {
            this.profile.readingLevel = "advanced";
        } else if (this.profile.totalInteractions > 30) {
            this.profile.readingLevel = "intermediate";
        }
    }

    generateSystemPrompt(): string {
        const adaptations =
            this.profile.preferredAnalogies.length > 0
                ? this.profile.preferredAnalogies.join("; ")
                : "Use clear explanations with examples, visual aids, and step-by-step walkthroughs";

        const level = this.profile.readingLevel;

        const dominant =
            this.profile.visualScore >= this.profile.auditoryScore &&
                this.profile.visualScore >= this.profile.kinestheticScore
                ? "visual"
                : this.profile.auditoryScore >= this.profile.kinestheticScore
                    ? "auditory"
                    : "kinesthetic";

        return `You are an adaptive tutor for a ${level}-level student.
Preferred learning modality: ${dominant}.
Teaching approach: ${adaptations}.
Always check understanding before proceeding. Use an encouraging, patient tone.
Break complex topics into small steps. Celebrate progress.
If the student struggles, try a different explanation method.
Keep responses concise and age-appropriate.`;
    }

    private async persist() {
        await saveProfile(this.profile);
    }
}
