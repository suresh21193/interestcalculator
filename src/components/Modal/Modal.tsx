"use client";

import React from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50"
             onClick={onClose}>
            <div className="bg-white p-6 rounded shadow-lg w-96 relative" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                        onClick={onClose}>
                    ✖
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
