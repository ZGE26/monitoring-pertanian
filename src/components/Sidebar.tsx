"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SlHome } from "react-icons/sl";
import { IoIosTime, IoIosAnalytics } from "react-icons/io";
import { LuUsers } from "react-icons/lu";
import { BiHistory } from "react-icons/bi";
import { IoMapSharp, IoSettingsSharp } from "react-icons/io5";
import { MdDeviceHub } from "react-icons/md";
import SubMenu from "./SubMenu";

// kamu bisa juga langsung pakai src="/next.svg" karena file ada di /public
const logoSrc = "/next.svg";

interface SidebarProps {
    show: boolean;
    setter: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MenuItemProps {
    icon: React.ReactNode;
    name: string;
    route: string;
}

export default function Sidebar({ show, setter }: SidebarProps) {
    const pathname = usePathname();

    // Base class
    const base =
        "bg-black w-[250px] h-screen fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out";
    const shift = show ? " translate-x-0" : " -translate-x-full md:translate-x-0";



    const MenuItem = ({ icon, name, route }: MenuItemProps) => {
        const active =
            pathname === route ? "text-white" : "text-white/50 hover:text-white";

        return (
            <Link
                href={route}
                onClick={() => {
                    // tutup sidebar setelah klik (khusus mobile / biar pasti close)
                    setter(false);
                }}
                className={`flex gap-1 [&>*]:my-auto text-md pl-6 py-3 border-b border-b-white/10 ${active}`}
            >
                <div className="text-xl flex [&>*]:mx-auto w-[30px]">{icon}</div>
                <div>{name}</div>
            </Link>
        );
    };

    const ModalOverlay = () => (
        <button
            aria-label="Close menu"
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setter(false)}
        />
    );

    return (
        <>
            <aside className={`${base}${shift}`}>
                <div className="p-2 flex">
                    <Link href="/">
                        {/* pakai img sederhana; bisa ganti ke next/image kalau mau */}
                        <img src={logoSrc} alt="Company Logo" width={300} height={300} />
                    </Link>
                </div>

                <nav className="flex flex-col">
                    {/* dashboard */}
                    <MenuItem name="Home" route="/" icon={<SlHome />} />
                    {/* Monitoring */}
                    <SubMenu title="Monitoring">
                        <MenuItem name="Realtime" route="/monitoring/realtime" icon={<IoIosTime />} />
                        <MenuItem name="History" route="/monitoring/histories" icon={<BiHistory />} />
                        <MenuItem name="Analizer" route="/monitoring/analizer" icon={<IoIosAnalytics />} />
                        <MenuItem name="Maps" route="/monitoring/maps" icon={<IoMapSharp />} />
                    </SubMenu>
                    {/* Management */}
                    <SubMenu title="Management">
                        <MenuItem name="Users" route="/management/users" icon={<LuUsers />} />
                        <MenuItem name="Devices" route="/management/devices" icon={<MdDeviceHub />} />
                        <MenuItem name="Settings" route="/management/settings" icon={<IoSettingsSharp />} />
                    </SubMenu>
                </nav>
            </aside>

            {show ? <ModalOverlay /> : null}
        </>
    );
}
