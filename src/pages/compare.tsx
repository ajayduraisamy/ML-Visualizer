import  { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

import {
    FaChartLine,
    FaBrain,
    FaNetworkWired,
    FaProjectDiagram,
} from "react-icons/fa";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function Compare() {
    const { theme } = useTheme();
    

    const [points, setPoints] = useState<{ x: number; y: number }[]>([
        { x: 1, y: 1 },
        { x: 2, y: 2.3 },
        { x: 3, y: 2.7 },
        { x: 4, y: 3.8 },
        { x: 5, y: 5 },
    ]);
    const [xInput, setXInput] = useState("");
    const [yInput, setYInput] = useState("");

    const linearChartRef = useRef<HTMLCanvasElement | null>(null);
    const nnChartRef = useRef<HTMLCanvasElement | null>(null);
    const cnnChartRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const ctx1 = linearChartRef.current?.getContext("2d");
        const ctx2 = nnChartRef.current?.getContext("2d");
        const ctx3 = cnnChartRef.current?.getContext("2d");

        if (!ctx1 || !ctx2 || !ctx3) return;

        // 🟩 Linear Regression Chart
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const n = xs.length;
        const meanX = xs.reduce((a, b) => a + b) / n;
        const meanY = ys.reduce((a, b) => a + b) / n;
        const num = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0);
        const den = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0);
        const slope = num / den;
        const intercept = meanY - slope * meanX;

        const regressionY = xs.map((x) => slope * x + intercept);

        const linearChart = new Chart(ctx1, {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Data Points",
                        data: points,
                        backgroundColor: "#3b82f6",
                    },
                    {
                        label: "Regression Line",
                        type: "line",
                        data: xs.map((x, i) => ({ x, y: regressionY[i] })),
                        borderColor: "#10b981",
                        fill: false,
                        tension: 0.3,
                    },
                ],
            },
            options: {
                responsive: true,
                animation: { duration: 0 },
                scales: {
                    x: { type: "linear", title: { display: true, text: "X" } },
                    y: { type: "linear", title: { display: true, text: "Y" } },
                },
            },
        });

        // 🧠 Neural Network Activation Visualization
        const nnChart = new Chart(ctx2, {
            type: "line",
            data: {
                labels: Array.from({ length: 50 }, (_, i) => i),
                datasets: [
                    {
                        label: "Neuron Activation (sigmoid)",
                        data: Array.from({ length: 50 }, (_, i) =>
                            1 / (1 + Math.exp(-(i / 5 - 5)))
                        ),
                        borderColor: "#f59e0b",
                        fill: false,
                    },
                ],
            },
            options: {
                animation: { duration: 1000 },
                responsive: true,
                scales: {
                    x: { title: { display: true, text: "Input Signal" } },
                    y: { title: { display: true, text: "Activation Output" } },
                },
            },
        });

        // 🧩 CNN Feature Map Visualization (simulated heatmap)
        const cnnChart = new Chart(ctx3, {
            type: "bar",
            data: {
                labels: ["Edge 1", "Edge 2", "Corner", "Texture", "Pattern"],
                datasets: [
                    {
                        label: "Feature Strength",
                        data: [0.2, 0.6, 0.8, 0.5, 0.9],
                        backgroundColor: [
                            "#3b82f6",
                            "#60a5fa",
                            "#10b981",
                            "#facc15",
                            "#ef4444",
                        ],
                    },
                ],
            },
            options: {
                responsive: true,
                animation: { duration: 800 },
                scales: {
                    y: { min: 0, max: 1, title: { display: true, text: "Activation Strength" } },
                },
            },
        });

        return () => {
            linearChart.destroy();
            nnChart.destroy();
            cnnChart.destroy();
        };
    }, [points]);

    const addPoint = () => {
        const x = parseFloat(xInput);
        const y = parseFloat(yInput);
        if (!isNaN(x) && !isNaN(y)) {
            setPoints((prev) => [...prev, { x, y }]);
            setXInput("");
            setYInput("");
        }
    };

    return (
        <div
            className={`min-h-screen pt-24 pb-10 transition-all duration-500 ${theme === "dark"
                ? "bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white"
                : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-black"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6">
                <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-3">
                    <FaProjectDiagram className="text-blue-600" />
                    Model Comparison Dashboard
                </h1>

                {/* Inputs */}
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <input
                        type="number"
                        placeholder="X value"
                        value={xInput}
                        onChange={(e) => setXInput(e.target.value)}
                        className="border rounded-md px-3 py-2"
                    />
                    <input
                        type="number"
                        placeholder="Y value"
                        value={yInput}
                        onChange={(e) => setYInput(e.target.value)}
                        className="border rounded-md px-3 py-2"
                    />
                    <button
                        onClick={addPoint}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md"
                    >
                        Add Point
                    </button>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div
                        className={`rounded-xl shadow-lg p-4 border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                            <FaChartLine className="text-blue-500" /> Linear Regression
                        </h2>
                        <canvas ref={linearChartRef} height={200}></canvas>
                    </div>

                    <div
                        className={`rounded-xl shadow-lg p-4 border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                            <FaBrain className="text-yellow-500" /> Neural Network
                        </h2>
                        <canvas ref={nnChartRef} height={200}></canvas>
                    </div>

                    <div
                        className={`rounded-xl shadow-lg p-4 border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                            }`}
                    >
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
                            <FaNetworkWired className="text-green-500" /> CNN Feature Map
                        </h2>
                        <canvas ref={cnnChartRef} height={200}></canvas>
                    </div>
                </div>

                {/* Explanations */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className={`rounded-xl p-5 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                        <h3 className="text-lg font-semibold text-blue-500 mb-2">Linear Regression</h3>
                        <p className="text-sm">
                            Finds the best-fit line (Y = mX + b) to predict continuous outputs.
                            Each update adjusts the slope (m) and intercept (b) to minimize error.
                        </p>
                    </div>
                    <div className={`rounded-xl p-5 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                        <h3 className="text-lg font-semibold text-yellow-500 mb-2">Neural Network</h3>
                        <p className="text-sm">
                            Processes inputs through connected neurons using weights and activation functions.
                            Each neuron learns to detect patterns and relationships in data.
                        </p>
                    </div>
                    <div className={`rounded-xl p-5 ${theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                        <h3 className="text-lg font-semibold text-green-500 mb-2">Convolutional Neural Network</h3>
                        <p className="text-sm">
                            Uses convolution filters to detect edges, textures, and features in images.
                            Feature maps visualize what patterns the CNN has learned.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
