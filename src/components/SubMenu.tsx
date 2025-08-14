'use client';

import React, { useState } from 'react';


interface SubMenuProps {
    title: string;
    children: React.ReactNode;
}

export default function SubMenu({ title, children }: SubMenuProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border-b border-white/10">
            <button
                className="flex justify-between items-center w-full px-6 py-3 text-md text-white hover:text-white/80"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <span className={`text-xl ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="pl-6 pb-3">
                    {children}
                </div>
            )}
        </div>
    );
}

