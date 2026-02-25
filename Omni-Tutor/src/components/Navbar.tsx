"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const links = [
        { href: "/", label: "Home" },
        { href: "/learn", label: "Learn" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/settings", label: "Settings" },
    ];

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand" aria-label="Omni-Tutor Home">
                    <span className="navbar-brand-icon">🚀</span>
                    Omni-Tutor
                </Link>

                <div className="navbar-links">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`nav-link${pathname === link.href ? " active" : ""}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <span className={`status-badge ${isOnline ? "status-online" : "status-offline"}`}>
                        <span className="status-dot" />
                        {isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>
        </nav>
    );
}
