"use client";
// components/ClientLayout.tsx
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen/SplashScreen";

export default function ClientLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const pathName = usePathname();
    const isHome = pathName === "/";

    // Start with isLoading as undefined to avoid hydration mismatch
    const [isLoading, setIsLoading] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        // Only set isLoading to true after client-side rendering
        setIsLoading(true);
    }, []);

    // Return children directly during SSR or when not on home page
    if (isLoading === undefined || !isHome) {
        return <>{children}</>;
    }

    // Only show splash screen on client once we know we're on home page
    return isLoading ? (
        <SplashScreen finishLoading={() => setIsLoading(false)} />
    ) : (
        <>{children}</>
    );
}