import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
    FaChartLine,
    FaProjectDiagram,
    FaBrain,
    FaNetworkWired,
} from "react-icons/fa";

export default function Compare() {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const cards = [
        {
            title: "Linear Regression",
            desc: "Visualize how linear regression works with interactive gradient descent animation. Adjust parameters in real-time.",
            color: "from-blue-500 to-cyan-500",
            glow: "blue",
            icon: <FaChartLine className="text-3xl" />,
            path: "/linear-regression",
        },
        {
            title: "Decision Boundaries",
            desc: "See how different classification algorithms create decision boundaries between classes. Create your own datasets.",
            color: "from-green-500 to-emerald-500",
            glow: "green",
            icon: <FaProjectDiagram className="text-3xl" />,
            path: "/decision-boundaries",
        },
        {
            title: "Neural Networks",
            desc: "Visualize neural network architecture and see how signals propagate through the network. Customize the architecture.",
            color: "from-purple-500 to-pink-500",
            glow: "purple",
            icon: <FaBrain className="text-3xl" />,
            path: "/neural-networks",
        },
        {
            title: "CNN Visualizer",
            desc: "Visualize how CNNs process images for digit recognition. Draw digits and see the network in action.",
            color: "from-indigo-500 to-blue-500",
            glow: "indigo",
            icon: <FaNetworkWired className="text-3xl" />,
            path: "/cnn-visualizer",
        },
    ];

    return (
        <div
            className={`min-h-screen pt-24 pb-10 transition-all duration-500 ${theme === "dark"
                ? "bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white"
                : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-black"
                }`}
        >
            {/* Hero Section */}
            <section className="text-center px-6">
                <div className="relative inline-block">
                    <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6 relative z-10">
                        Machine Learning Visualizer
                    </h1>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl scale-110 rounded-full"></div>
                </div>
                <p
                    className={`text-xl max-w-3xl mx-auto leading-relaxed font-medium ${theme === "dark"
                        ? "text-white/70 bg-gradient-to-r from-white/5 to-transparent p-6 rounded-2xl border border-white/10"
                        : "text-black/70 bg-gradient-to-r from-black/5 to-transparent p-6 rounded-2xl border border-black/10"
                        }`}
                >
                    Explore and understand ML concepts through interactive visual demonstrations.
                    <span className="block text-sm mt-2 opacity-60">
                        Built for students, educators, and ML enthusiasts
                    </span>
                </p>
            </section>

            {/* Visualization Cards */}
            <section className="mt-20 flex flex-wrap justify-center gap-8 px-6">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className="group relative w-full sm:w-[350px] transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                    >
                        {/* Glow */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                        ></div>

                        {/* Card */}
                        <div
                            className={`relative bg-gradient-to-br ${card.color} p-[2px] rounded-2xl shadow-2xl ${theme === "dark"
                                ? `shadow-${card.glow}-500/10 hover:shadow-${card.glow}-500/30`
                                : `shadow-${card.glow}-500/20 hover:shadow-${card.glow}-500/40`
                                } transition-all duration-500`}
                        >
                            <div
                                className={`rounded-2xl p-8 min-h-[380px] flex flex-col justify-between backdrop-blur-sm ${theme === "dark"
                                    ? "bg-gray-900/80 border border-gray-700/50"
                                    : "bg-white/80 border border-white/50"
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <span>{card.icon}</span>
                                        <h3
                                            className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}
                                        >
                                            {card.title}
                                        </h3>
                                    </div>
                                    <p
                                        className={`text-base leading-relaxed ${theme === "dark" ? "text-white/70" : "text-black/70"
                                            }`}
                                    >
                                        {card.desc}
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(card.path)}
                                    className={`mt-6 group relative overflow-hidden bg-gradient-to-r ${card.color} text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg w-fit self-center`}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Explore
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                                            →
                                        </span>
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* How to Use Section */}
            <section className="mt-28 px-6">
                <div className="text-center mb-12">
                    <h2
                        className={`text-4xl font-black mb-4 ${theme === "dark" ? "text-white" : "text-black"
                            }`}
                    >
                        How to Use This Tool
                    </h2>
                    <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                </div>

                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* For Students */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div
                            className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                ? "bg-gray-900/60 border-blue-500/30"
                                : "bg-white/60 border-blue-400/30"
                                } transition-all duration-500 group-hover:border-blue-500/50`}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                    <span className="text-2xl">🎓</span>
                                </div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                    For Students
                                </h3>
                            </div>
                            <ul
                                className={`space-y-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                    }`}
                            >
                                {[
                                    "Explore visualizations to reinforce concepts with interactive playgrounds",
                                    "Adjust parameters in real-time to see immediate effects on models",
                                    "Test understanding with built-in challenges and quizzes",
                                ].map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-4 p-3 rounded-lg bg-gradient-to-r from-transparent to-blue-500/5"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mt-0.5">
                                            <span className="text-white text-xs font-bold">
                                                {i + 1}
                                            </span>
                                        </div>
                                        <span className="text-lg leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* For Educators */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <div
                            className={`relative p-8 rounded-2xl border-2 backdrop-blur-sm ${theme === "dark"
                                ? "bg-gray-900/60 border-purple-500/30"
                                : "bg-white/60 border-purple-400/30"
                                } transition-all duration-500 group-hover:border-purple-500/50`}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                    <span className="text-2xl">👨‍🏫</span>
                                </div>
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    For Educators
                                </h3>
                            </div>
                            <ul
                                className={`space-y-4 ${theme === "dark" ? "text-white/80" : "text-black/80"
                                    }`}
                            >
                                {[
                                    "Use visualizations in class demos with full-screen presentation mode",
                                    "Show complex concepts interactively with step-by-step explanations",
                                    "Guide students through examples with integrated annotation tools",
                                ].map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-4 p-3 rounded-lg bg-gradient-to-r from-transparent to-purple-500/5"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mt-0.5">
                                            <span className="text-white text-xs font-bold">
                                                {i + 1}
                                            </span>
                                        </div>
                                        <span className="text-lg leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
