import { useState } from "react";
import {
    FaBrain,
    FaChartLine,
    FaHome,
    FaInfoCircle,
    FaMoon,
    FaNetworkWired,
    FaProjectDiagram,
    FaSun,
    FaBars,
    FaTimes,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
    const loc = useLocation();
    const { theme, toggle } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const links = [
        { path: "/", label: "Home", icon: <FaHome /> },
        { path: "/about", label: "About", icon: <FaInfoCircle /> },
        { path: "/linear-regression", label: "Linear Regression", icon: <FaChartLine /> },
        { path: "/decision-boundaries", label: "Decision Boundaries", icon: <FaProjectDiagram /> },
        { path: "/neural-networks", label: "Neural Networks", icon: <FaBrain /> },
        { path: "/cnn-visualizer", label: "CNN Visualizer", icon: <FaNetworkWired /> },
        { path: "/compare", label: "Compare", icon: <FaNetworkWired /> },
    ];

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 backdrop-blur-lg shadow-sm
      ${theme === "dark"
                    ? "bg-black text-white border-b border-blue-500/30"
                    : "bg-white text-black border-b border-blue-500/10"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide select-none">
                    ML Visualizer

                </div>

               
                <nav className="hidden md:flex gap-6 text-[15px] font-medium">
                    {links.map((link) => {
                        const isActive = loc.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative group flex items-center gap-2 
                ${isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-inherit"
                                    } hover:text-blue-500 dark:hover:text-blue-400 transition duration-300`}
                            >
                                {link.icon}
                                {link.label}
                                <span
                                    className={`absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-500 rounded transition-all duration-300 group-hover:w-full ${isActive ? "w-full" : ""}`}
                                ></span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    
                    <button
                        onClick={toggle}
                        className="p-2 rounded-full border border-blue-400 hover:scale-110 transition-transform duration-200 bg-white/70 dark:bg-black/70 backdrop-blur flex items-center justify-center shadow-md"
                    >
                        {theme === "dark" ? (
                            <FaSun size={18} className="text-yellow-400" />
                        ) : (
                            <FaMoon size={18} className="text-blue-600" />
                        )}
                    </button>

                    
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg border border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                        {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                    </button>
                </div>
            </div>

            
            {isMenuOpen && (
                <div className="md:hidden border-t border-blue-500/20">
                    <nav className="px-6 py-4 flex flex-col gap-4">
                        {links.map((link) => {
                            const isActive = loc.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? "bg-blue-500 text-white shadow-lg"
                                            : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        }`}
                                >
                                    {link.icon}
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}