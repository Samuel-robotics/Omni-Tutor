"use client";

interface ChatBubbleProps {
    role: "ai" | "user" | "system";
    content: string;
    isLoading?: boolean;
}

export default function ChatBubble({ role, content, isLoading }: ChatBubbleProps) {
    const bubbleClass = `chat-bubble chat-bubble-${role === "user" ? "user" : role === "system" ? "system" : "ai"}`;

    return (
        <div className={bubbleClass}>
            {content || (isLoading ? (
                <span className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </span>
            ) : "")}
        </div>
    );
}
