import React from "react";
import { useTheme } from "../context/ThemeContext";
import {
    FaCode,
    FaChartLine,
    FaLayerGroup,
    FaRocket,
    FaLightbulb,
    FaShieldAlt,
    FaCogs,
    FaNetworkWired,
    FaFilter,
    FaCube,
    FaMagic
} from "react-icons/fa";

const About: React.FC = () => {
    const { theme } = useTheme();

    return (
        <div
            className={`min-h-screen pt-24 pb-10 transition-all duration-500 ${theme === "dark"
                    ? "bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white"
                    : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-black"
                }`}
        >
            <div className="max-w-7xl mx-auto space-y-16 px-6">
                {/* Header Section */}
                <section className="text-center space-y-6">
                    <div className="relative inline-block">
                        <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-violet-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 relative z-10">
                            About ML Visualizer
                        </h1>
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-pink-500/20 blur-2xl scale-110 rounded-full"></div>
                    </div>
                    <p className={`text-xl max-w-4xl mx-auto leading-relaxed font-medium ${theme === "dark"
                            ? "text-white/70 bg-gradient-to-r from-white/5 to-transparent p-8 rounded-3xl border border-white/10"
                            : "text-black/70 bg-gradient-to-r from-black/5 to-transparent p-8 rounded-3xl border border-black/10"
                        }`}>
                        An interactive educational platform to help you understand machine learning concepts
                        through intuitive visual demonstrations and hands-on experimentation.
                    </p>
                </section>

                {/* Overview Cards */}
                <section className="grid lg:grid-cols-2 gap-8">
                    {/* Project Overview Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                ? "bg-gray-900/60 border-violet-500/30"
                                : "bg-white/60 border-violet-400/30"
                            } transition-all duration-500 group-hover:border-violet-500/50 group-hover:scale-105`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white">
                                    <FaRocket className="text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                    Project Overview
                                </h2>
                            </div>
                            <p className={`text-lg leading-relaxed mb-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                }`}>
                                ML Visualizer bridges the gap between theoretical knowledge and practical understanding of machine learning concepts. Our platform transforms complex algorithms into interactive, visual experiences.
                            </p>
                            <p className={`text-lg leading-relaxed ${theme === "dark" ? "text-white/70" : "text-black/70"
                                }`}>
                                Featuring modular visualizations that allow real-time parameter manipulation, you can observe how different algorithms behave under various conditions and gain valuable insights into model internals.
                            </p>
                        </div>
                    </div>

                    {/* Educational Benefits Card */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                ? "bg-gray-900/60 border-teal-500/30"
                                : "bg-white/60 border-teal-400/30"
                            } transition-all duration-500 group-hover:border-teal-500/50 group-hover:scale-105`}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                                    <FaLightbulb className="text-2xl" />
                                </div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                                    Educational Benefits
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    "Visualize abstract mathematical concepts in intuitive ways",
                                    "Experiment with parameters to develop algorithmic intuition",
                                    "Understand complex behaviors through interactive animations",
                                    "Bridge theory and practice with hands-on learning"
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-start gap-4 p-3 rounded-xl bg-gradient-to-r from-transparent to-teal-500/5">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mt-1">
                                            <span className="text-white text-xs font-bold">{index + 1}</span>
                                        </div>
                                        <span className={`text-lg ${theme === "dark" ? "text-white/80" : "text-black/80"}`}>
                                            {benefit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Available Visualizations */}
                <section className="space-y-12">
                    <div className="text-center">
                        <h2 className="text-4xl font-black bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                            Available Visualizations
                        </h2>
                        <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Linear Regression */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                            <div className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                    ? "bg-gray-900/60 border-blue-500/30"
                                    : "bg-white/60 border-blue-400/30"
                                } transition-all duration-500 group-hover:border-blue-500/50 group-hover:scale-105`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                        <FaChartLine className="text-xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                        Linear Regression
                                    </h3>
                                </div>
                                <p className={`text-lg leading-relaxed mb-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                    }`}>
                                    Explore how linear regression finds the best-fitting line through gradient descent. Watch the algorithm converge in real-time as it optimizes model parameters.
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        "Adjust learning rate and observe convergence speed",
                                        "Manipulate slope and intercept manually",
                                        "Generate random datasets to test the algorithm"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                                            <span className={`text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Decision Boundaries */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                            <div className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                    ? "bg-gray-900/60 border-green-500/30"
                                    : "bg-white/60 border-green-400/30"
                                } transition-all duration-500 group-hover:border-green-500/50 group-hover:scale-105`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                                        <FaLayerGroup className="text-xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                        Decision Boundaries
                                    </h3>
                                </div>
                                <p className={`text-lg leading-relaxed mb-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                    }`}>
                                    Understand how classification algorithms separate data into different classes. Compare multiple algorithms and watch decision boundaries form in real-time.
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        "Create your own dataset interactively",
                                        "Switch between Logistic Regression, SVM, and KNN",
                                        "Adjust algorithm parameters and observe boundary changes"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-green-500 to-emerald-500"></div>
                                            <span className={`text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Neural Networks */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                            <div className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                    ? "bg-gray-900/60 border-purple-500/30"
                                    : "bg-white/60 border-purple-400/30"
                                } transition-all duration-500 group-hover:border-purple-500/50 group-hover:scale-105`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                        <FaNetworkWired className="text-xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Neural Networks
                                    </h3>
                                </div>
                                <p className={`text-lg leading-relaxed mb-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                    }`}>
                                    Visualize neural network architecture and signal propagation. Understand activation functions and their impact on network behavior through animated demonstrations.
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        "Customize layers and nodes dynamically",
                                        "Experiment with activation functions",
                                        "Watch animated signal propagation through layers"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
                                            <span className={`text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* CNNs */}
                        <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                            <div className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                    ? "bg-gray-900/60 border-indigo-500/30"
                                    : "bg-white/60 border-indigo-400/30"
                                } transition-all duration-500 group-hover:border-indigo-500/50 group-hover:scale-105`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
                                        <FaFilter className="text-xl" />
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                                        Convolutional Neural Networks
                                    </h3>
                                </div>
                                <p className={`text-lg leading-relaxed mb-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                    }`}>
                                    Explore CNN image processing through interactive visualization. Watch filters detect patterns and follow the complete pipeline from input to classification.
                                </p>
                                <ul className="space-y-2">
                                    {[
                                        "See filters in action detecting edges and patterns",
                                        "Visualize pooling operations and feature extraction",
                                        "Follow step-by-step digit recognition process"
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500"></div>
                                            <span className={`text-sm ${theme === "dark" ? "text-white/70" : "text-black/70"}`}>
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Technical Implementation */}
                <section className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className={`relative p-12 rounded-3xl border-2 backdrop-blur-sm ${theme === "dark"
                            ? "bg-gray-900/60 border-violet-500/30"
                            : "bg-white/60 border-violet-400/30"
                        } transition-all duration-500 group-hover:border-violet-500/50`}>
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-black bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-4">
                                Technical Implementation
                            </h2>
                            <div className="w-32 h-1 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-pink-500"></div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-4 mb-8">
                            {[
                                { icon: FaCode, label: "Vite + TypeScript", color: "from-blue-500 to-cyan-500" },
                                { icon: FaCube, label: "Recharts", color: "from-green-500 to-emerald-500" },
                                { icon: FaCogs, label: "React Hooks", color: "from-purple-500 to-pink-500" },
                                { icon: FaMagic, label: "Tailwind CSS", color: "from-orange-500 to-red-500" },
                                { icon: FaShieldAlt, label: "Context API", color: "from-indigo-500 to-blue-500" }
                            ].map((tech, index) => (
                                <div key={index} className="group/tech relative">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} rounded-2xl blur-md opacity-30 group-hover/tech:opacity-50 transition-opacity duration-300`}></div>
                                    <div className={`relative px-6 py-3 rounded-2xl border backdrop-blur-sm ${theme === "dark"
                                            ? "bg-gray-800/80 border-gray-700"
                                            : "bg-white/80 border-gray-200"
                                        } transition-all duration-300 group-hover/tech:scale-110`}>
                                        <div className="flex items-center gap-3">
                                            <tech.icon className={`text-lg bg-gradient-to-br ${tech.color} bg-clip-text text-transparent`} />
                                            <span className={`font-semibold ${theme === "dark" ? "text-white/90" : "text-black/90"
                                                }`}>
                                                {tech.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className={`text-lg text-center max-w-3xl mx-auto ${theme === "dark" ? "text-white/70" : "text-black/70"
                            }`}>
                            These visualizations are designed for learning, simplifying complex ML concepts while
                            maintaining mathematical accuracy and providing real-time interactive experiences.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About;