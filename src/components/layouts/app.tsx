'use client';

import React, { useState, useEffect, use } from 'react'
import Head from 'next/head'
import Sidebar from '../Sidebar';
import MenuBarMobile from '../MenuBarMobile';

interface LayoutProps {
    pageTitle?: string;
    children: React.ReactNode;
}

export default function Layout({ pageTitle, children }: LayoutProps) {
    // Concatenate page title (if exists) to site title
    let titleConcat = "Responsive Sidebar Example";
    if (pageTitle) titleConcat = pageTitle + " | " + titleConcat;

    const [loading, setLoading] = useState(true);

    // Mobile sidebar visibility state
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <>
            <Head>
                <title>{titleConcat}</title>
            </Head>
            <div className="h-screen overflow-hidden">
                <div className="flex">
                    <MenuBarMobile setter={setShowSidebar} />
                    <Sidebar show={showSidebar} setter={setShowSidebar} />
                    <div className="flex flex-col flex-grow w-screen md:w-full h-screen p-4 overflow-y-auto md:ml-[250px]">
                        {loading ?
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
                            </div> :
                            <>{children}</>}
                    </div>
                </div>
            </div>
        </>
    )
}