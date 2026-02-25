"use client";

interface SubjectCardProps {
    subject: string;
    icon: string;
    title: string;
    description?: string;
    selected?: boolean;
    onClick?: () => void;
    stats?: {
        completed: number;
        total: number;
        avgScore: number;
    };
    href?: string;
}

export default function SubjectCard({
    subject,
    icon,
    title,
    description,
    selected = false,
    onClick,
    stats,
}: SubjectCardProps) {
    const subjectClass =
        subject === "mathematics" ? "math" :
            subject === "science" ? "science" : "literacy";

    return (
        <div
            className={`subject-card ${subjectClass}`}
            onClick={onClick}
            style={{
                cursor: onClick ? "pointer" : "default",
                outline: selected ? "2px solid var(--accent-primary)" : "none",
                outlineOffset: 2,
            }}
            id={`subject-card-${subject}`}
        >
            <div className="subject-icon">{icon}</div>
            <h3 style={{
                fontSize: "var(--font-lg)",
                fontWeight: 700,
                marginBottom: "var(--space-sm)",
                textTransform: "capitalize" as const,
            }}>
                {title}
            </h3>

            {description && (
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                    {description}
                </p>
            )}

            {selected && (
                <span style={{ position: "absolute", top: 12, right: 12, fontSize: 20 }}>
                    ✅
                </span>
            )}

            {stats && (
                <>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "var(--space-md)",
                        marginBottom: "var(--space-sm)",
                    }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                            Exercises
                        </span>
                        <span style={{ fontWeight: 600 }}>
                            {stats.completed}/{stats.total}
                        </span>
                    </div>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "var(--space-md)",
                    }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-sm)" }}>
                            Avg Score
                        </span>
                        <span style={{
                            fontWeight: 600,
                            color: stats.avgScore >= 70
                                ? "var(--success)"
                                : stats.avgScore >= 40
                                    ? "var(--warning)"
                                    : "var(--error)",
                        }}>
                            {stats.avgScore}%
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
