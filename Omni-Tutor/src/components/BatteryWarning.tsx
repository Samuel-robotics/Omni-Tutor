"use client";

interface BatteryWarningProps {
    visible: boolean;
    onDismiss: () => void;
}

export default function BatteryWarning({ visible, onDismiss }: BatteryWarningProps) {
    if (!visible) return null;

    return (
        <div className="battery-warning" id="battery-warning">
            🔋 Low battery! AI inference paused to save power.
            <button
                className="btn btn-sm"
                style={{
                    marginLeft: "var(--space-md)",
                    background: "rgba(255,255,255,0.2)",
                    color: "white",
                }}
                onClick={onDismiss}
                id="battery-warning-dismiss"
            >
                Dismiss
            </button>
        </div>
    );
}
