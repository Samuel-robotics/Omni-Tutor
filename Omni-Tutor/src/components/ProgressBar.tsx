"use client";

interface ProgressBarProps {
    value: number; // 0 to 1
    label?: string;
    height?: number;
    showLabel?: boolean;
    variant?: "default" | "success" | "warning";
}

export default function ProgressBar({
    value,
    label,
    height = 8,
    showLabel = false,
    variant = "default",
}: ProgressBarProps) {
    const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

    const fillStyle: React.CSSProperties = {
        width: `${pct}%`,
    };

    if (variant === "success") {
        fillStyle.background = "linear-gradient(135deg, #059669, #10b981)";
    } else if (variant === "warning") {
        fillStyle.background = "linear-gradient(135deg, #d97706, #f59e0b)";
    }

    return (
        <div>
            <div className="progress-bar" style={{ height }}>
                <div className="progress-fill" style={fillStyle} />
            </div>
            {(showLabel || label) && (
                <p style={{
                    fontSize: "var(--font-xs)",
                    color: "var(--text-muted)",
                    marginTop: 4,
                    display: "flex",
                    justifyContent: "space-between",
                }}>
                    {label && <span>{label}</span>}
                    {showLabel && <span>{pct}%</span>}
                </p>
            )}
        </div>
    );
}
