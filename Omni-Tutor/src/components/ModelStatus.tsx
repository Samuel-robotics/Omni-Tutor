"use client";

interface ModelStatusProps {
    status: string;
    modelName?: string;
    isLoaded?: boolean;
}

export default function ModelStatus({ status, modelName, isLoaded = false }: ModelStatusProps) {
    return (
        <span
            className={`model-badge${isLoaded ? " loaded" : ""}`}
            title={modelName || undefined}
            id="model-status-badge"
        >
            🤖 {status}
        </span>
    );
}
