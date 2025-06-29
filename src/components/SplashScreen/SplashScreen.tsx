"use client";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import anime from "animejs";

interface SplashScreenProps {
    finishLoading: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ finishLoading }) => {
    const logoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const animate = () => {
            const loader = anime.timeline({
                complete: () => finishLoading(),
            });

            loader
                .add({
                    targets: logoRef.current,
                    delay: 0,
                    scale: 4,
                    duration: 500,
                    easing: "easeInOutExpo",
                })
                .add({
                    targets: logoRef.current,
                    delay: 0,
                    scale: 6,
                    duration: 500,
                    easing: "easeInOutExpo",
                })
                .add({
                    targets: logoRef.current,
                    delay: 0,
                    scale: 8,
                    duration: 500,
                    easing: "easeInOutExpo",
                });
        };

        animate();
    }, [finishLoading]);

    return (
        <div className="fixed inset-0 flex flex-col h-screen w-full items-center justify-between bg-gray-300 z-50 p-6">
            {/* Top Section: Main Logo */}
            <div className="flex flex-1 items-center justify-center">
                <div ref={logoRef} className="relative">
                    <Image
                        src="/images/logo/interestlogo.png"
                        alt="Logo"
                        width={50}
                        height={50}
                        priority
                    />
                </div>
            </div>

            {/* Bottom Section: Powered By */}
            <div className="flex flex-col items-center pb-4">
                {/*<Image
                    src="/images/logo/creator/brandzon_logo.png"
                    alt="Brandzon Digital Logo"
                    width={200} // Adjusted size for smaller screens
                    height={200}
                    className="max-h-[10vh] md:max-h-[15vh]"
                />*/}
                <span className="text-gray-700 font-medium text-sm md:text-base">
                    Powered by BRANDZON DIGITAL
                </span>
            </div>
        </div>
    );
};

export default SplashScreen;
