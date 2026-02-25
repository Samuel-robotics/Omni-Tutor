// WebLLM is loaded dynamically to code-split the ~6MB bundle.
// It only downloads when the user actually clicks "Load AI".

type WebLLMModule = typeof import("@mlc-ai/web-llm");

const MODEL_CONFIG = {
    primary: "gemma-2b-it-q4f16_1-MLC",
    premium: "Llama-3-8B-Instruct-q4f16_1-MLC",
    fallback: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
};

export type ModelTier = "primary" | "premium" | "fallback";

export interface ModelLoadProgress {
    progress: number;
    text: string;
}

type ProgressCallback = (report: ModelLoadProgress) => void;

// Cached module reference so we only dynamic-import once
let webllmModule: WebLLMModule | null = null;

async function getWebLLM(): Promise<WebLLMModule> {
    if (!webllmModule) {
        webllmModule = await import("@mlc-ai/web-llm");
    }
    return webllmModule;
}

export class LocalTutor {
    private engine: any = null;
    private _modelLoaded = false;
    private _currentModel: string = "";
    private onProgress: ProgressCallback | null = null;

    get modelLoaded() {
        return this._modelLoaded;
    }
    get currentModel() {
        return this._currentModel;
    }

    setProgressCallback(cb: ProgressCallback) {
        this.onProgress = cb;
    }

    async initialize(tier: ModelTier = "primary"): Promise<void> {
        const webllm = await getWebLLM();
        const modelId = MODEL_CONFIG[tier];
        const initProgressCallback = (report: { progress: number; text: string }) => {
            this.onProgress?.({ progress: report.progress, text: report.text });
        };

        try {
            this.engine = await webllm.CreateMLCEngine(modelId, {
                initProgressCallback,
            });
            this._modelLoaded = true;
            this._currentModel = modelId;
        } catch (e) {
            // Cascade to smaller model
            if (tier === "primary") {
                return this.initialize("fallback");
            }
            throw e;
        }
    }

    async generateResponse(
        prompt: string,
        systemContext: string,
        onChunk?: (text: string) => void
    ): Promise<string> {
        if (!this.engine) throw new Error("Engine not initialized");

        const messages = [
            { role: "system" as const, content: systemContext },
            { role: "user" as const, content: prompt },
        ];

        const completion = await this.engine.chat.completions.create({
            messages,
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
        });

        let fullResponse = "";
        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            fullResponse += delta;
            onChunk?.(fullResponse);
        }

        return fullResponse;
    }

    async destroy() {
        if (this.engine) {
            this.engine = null;
            this._modelLoaded = false;
            this._currentModel = "";
        }
    }
}

// Singleton instance
let tutorInstance: LocalTutor | null = null;

export function getTutor(): LocalTutor {
    if (!tutorInstance) {
        tutorInstance = new LocalTutor();
    }
    return tutorInstance;
}

