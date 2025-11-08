import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

import { Chart, registerables } from "chart.js";
import {
    FaBrain,
    FaCalculator,
    FaChartLine,
    FaNetworkWired,
    FaPause,
    FaPlay,
    FaProjectDiagram,
    FaRedo
} from "react-icons/fa";

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
    const [animationState, setAnimationState] = useState({
        linear: 'paused',
        nn: 'paused',
        cnn: 'paused'
    });
    const [calculations, setCalculations] = useState({
        slope: 0,
        intercept: 0,
        rSquared: 0,
        mse: 0
    });
    const [activeModel, setActiveModel] = useState<string | null>(null);

    const linearChartRef = useRef<HTMLCanvasElement | null>(null);
    const nnChartRef = useRef<HTMLCanvasElement | null>(null);
    const cnnChartRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number>(0);
    const frameRef = useRef<number>(0);

    const [linearProgress, setLinearProgress] = useState(0);
    const [nnProgress, setNnProgress] = useState(0);
    const [cnnProgress, setCnnProgress] = useState(0);
    const [linearAccuracy, setLinearAccuracy] = useState(0);
    const [nnAccuracy, setNnAccuracy] = useState(0);
    const [cnnAccuracy, setCnnAccuracy] = useState(0);
    const [showAccuracy, setShowAccuracy] = useState({
        linear: false,
        nn: false,
        cnn: false
    });



    const getAxisLimits = () => {
        if (points.length === 0) return { xMin: 0, xMax: 6, yMin: 0, yMax: 6 };

        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);

        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);
        const yMin = Math.min(...ys);
        const yMax = Math.max(...ys);


        const xPadding = (xMax - xMin) * 0.1;
        const yPadding = (yMax - yMin) * 0.1;

        return {
            xMin: Math.max(0, xMin - xPadding),
            xMax: xMax + xPadding,
            yMin: Math.max(0, yMin - yPadding),
            yMax: yMax + yPadding
        };
    };

    const calculateRegression = () => {
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
        const ssRes = ys.reduce((acc, y, i) => acc + (y - regressionY[i]) ** 2, 0);
        const ssTot = ys.reduce((acc, y) => acc + (y - meanY) ** 2, 0);
        const rSquared = 1 - (ssRes / ssTot);
        const mse = ssRes / n;

        setCalculations({ slope, intercept, rSquared, mse });

        return { slope, intercept, regressionY, xs };
    };

    const animateLinearRegression = (progress: number) => {
        const { slope, intercept, xs } = calculateRegression();
        const animatedPoints = xs.map(x => ({
            x,
            y: intercept + slope * x
        }));

        const visibleCount = Math.floor(animatedPoints.length * progress);
        return animatedPoints.slice(0, visibleCount);
    };


    const animateNeuralNetwork = (progress: number) => {
        const { slope, intercept } = calculateRegression();
        const xs = points.map(p => p.x);


        return xs.map(x => {

            const basePrediction = intercept + slope * x;
            const nonLinearComponent = Math.sin(x * 0.8) * progress * 2;
            return {
                x,
                y: basePrediction * (1 - progress) + (basePrediction + nonLinearComponent) * progress
            };
        });
    };


    const animateCNN = (progress: number) => {
        const { slope, intercept } = calculateRegression();
        const xs = points.map(p => p.x);


        return xs.map(x => {
            const normalizedProgress = progress * 1.5;
            const basePrediction = intercept + slope * x;


            const feature1 = Math.max(0, x - 2) * progress;
            const feature2 = Math.sin(x * 0.5) * progress * 0.5;

            return {
                x,
                y: basePrediction * (1 - normalizedProgress) +
                    (basePrediction + feature1 + feature2) * normalizedProgress
            };
        });
    };

    const calculateAccuracy = (predictions: { x: number; y: number }[]) => {
        if (points.length === 0) return 0;

        let totalError = 0;
        let totalActual = 0;

        points.forEach((p, i) => {
            const pred = predictions[i]?.y ?? 0;
            totalError += Math.abs(p.y - pred);
            totalActual += Math.abs(p.y);
        });

        const mape = (totalError / totalActual) * 100;
        return Math.max(0, 100 - mape);
    };

    useEffect(() => {
        const ctx1 = linearChartRef.current?.getContext("2d");
        const ctx2 = nnChartRef.current?.getContext("2d");
        const ctx3 = cnnChartRef.current?.getContext("2d");

        if (!ctx1 || !ctx2 || !ctx3) return;

        const { slope, intercept } = calculateRegression();
        const axisLimits = getAxisLimits();


        const linearChart = new Chart(ctx1, {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Data Points",
                        data: points,
                        backgroundColor: "#3b82f6",
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    },
                    {
                        label: "Regression Line",
                        type: "line",
                        data: [],
                        borderColor: "#10b981",
                        borderWidth: 3,
                        fill: false,
                        tension: 0,
                        pointRadius: 0,
                    },
                    {
                        label: "Error Lines",
                        type: "line",
                        data: [],
                        borderColor: "#ef4444",
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        showLine: true,
                    }
                ],
            },
            options: {
                responsive: true,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        type: "linear",
                        title: { display: true, text: "X" },
                        grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
                        min: axisLimits.xMin,
                        max: axisLimits.xMax
                    },
                    y: {
                        type: "linear",
                        title: { display: true, text: "Y" },
                        grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
                        min: axisLimits.yMin,
                        max: axisLimits.yMax
                    },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === "Data Points") {
                                    return `Point: (${context.parsed.x}, ${context.parsed.y})`;
                                }
                                return context.dataset.label || '';
                            }
                        }
                    }
                }
            },
        });


        const nnChart = new Chart(ctx2, {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Data Points",
                        data: points,
                        backgroundColor: "#3b82f6",
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    },
                    {
                        label: "NN Prediction",
                        type: "line",
                        data: [],
                        borderColor: "#f59e0b",
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                    }
                ],
            },
            options: {
                animation: {
                    duration: 0
                },
                responsive: true,
                scales: {
                    x: {
                        type: "linear",
                        title: { display: true, text: "X" },
                        grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
                        min: axisLimits.xMin,
                        max: axisLimits.xMax
                    },
                    y: {
                        type: "linear",
                        title: { display: true, text: "Y" },
                        grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
                        min: axisLimits.yMin,
                        max: axisLimits.yMax
                    },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === "Data Points") {
                                    return `Point: (${context.parsed.x}, ${context.parsed.y})`;
                                }
                                return context.dataset.label || '';
                            }
                        }
                    }
                }
            },
        });


        const cnnChart = new Chart(ctx3, {
            type: "scatter",
            data: {
                datasets: [
                    {
                        label: "Data Points",
                        data: points,
                        backgroundColor: "#3b82f6",
                        pointRadius: 6,
                        pointHoverRadius: 8,
                    },
                    {
                        label: "CNN Prediction",
                        type: "line",
                        data: [],
                        borderColor: "#10b981",
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 0,
                    }
                ],
            },
            options: {
                responsive: true,
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        type: "linear",
                        title: { display: true, text: "X" },
                        grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
                        min: axisLimits.xMin,
                        max: axisLimits.xMax
                    },
                    y: {
                        type: "linear",
                        title: { display: true, text: "Y" },
                        grid: { color: theme === 'dark' ? '#374151' : '#e5e7eb' },
                        min: axisLimits.yMin,
                        max: axisLimits.yMax
                    },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.dataset.label === "Data Points") {
                                    return `Point: (${context.parsed.x}, ${context.parsed.y})`;
                                }
                                return context.dataset.label || '';
                            }
                        }
                    }
                }
            },
        });


        const animate = () => {
            frameRef.current++;


            if (animationState.linear === 'playing') {
                setLinearProgress(prev => {
                    const newProgress = Math.min(1, prev + 0.002);

                    // Calculate accuracy when training completes
                    if (newProgress >= 1 && prev < 1) {
                        const linearPreds = points.map(p => ({
                            x: p.x,
                            y: calculations.slope * p.x + calculations.intercept
                        }));
                        setLinearAccuracy(calculateAccuracy(linearPreds));
                        setShowAccuracy(prev => ({ ...prev, linear: true }));
                    }

                    const animatedLine = animateLinearRegression(newProgress);
                    linearChart.data.datasets[1].data = animatedLine;

                    const errorLines = points.flatMap((point, index) =>
                        index < Math.floor(points.length * newProgress)
                            ? [
                                { x: point.x, y: point.y },
                                { x: point.x, y: slope * point.x + intercept }
                            ]
                            : []
                    );
                    linearChart.data.datasets[2].data = errorLines;

                    linearChart.update('none');
                    return newProgress;
                });
            }


            if (animationState.nn === 'playing') {
                setNnProgress(prev => {
                    const newProgress = Math.min(1, prev + 0.0015);

                    // Calculate accuracy when training completes
                    if (newProgress >= 1 && prev < 1) {
                        const nnPreds = animateNeuralNetwork(1);
                        setNnAccuracy(calculateAccuracy(nnPreds));
                        setShowAccuracy(prev => ({ ...prev, nn: true }));
                    }

                    const nnPredictions = animateNeuralNetwork(newProgress);
                    nnChart.data.datasets[1].data = nnPredictions;
                    nnChart.update('none');
                    return newProgress;
                });
            }


            if (animationState.cnn === 'playing') {
                setCnnProgress(prev => {
                    const newProgress = Math.min(1, prev + 0.001);

                    // Calculate accuracy when training completes
                    if (newProgress >= 1 && prev < 1) {
                        const cnnPreds = animateCNN(1);
                        setCnnAccuracy(calculateAccuracy(cnnPreds));
                        setShowAccuracy(prev => ({ ...prev, cnn: true }));
                    }

                    const cnnPredictions = animateCNN(newProgress);
                    cnnChart.data.datasets[1].data = cnnPredictions;
                    cnnChart.update('none');
                    return newProgress;
                });
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        if (animationState.linear === 'playing' || animationState.nn === 'playing' || animationState.cnn === 'playing') {
            animate();
        } else {
            // Reset progress and hide accuracy when paused
            if (animationState.linear === 'paused') {
                setLinearProgress(0);
                setShowAccuracy(prev => ({ ...prev, linear: false }));
            }
            if (animationState.nn === 'paused') {
                setNnProgress(0);
                setShowAccuracy(prev => ({ ...prev, nn: false }));
            }
            if (animationState.cnn === 'paused') {
                setCnnProgress(0);
                setShowAccuracy(prev => ({ ...prev, cnn: false }));
            }
        }

        return () => {
            linearChart.destroy();
            nnChart.destroy();
            cnnChart.destroy();
            cancelAnimationFrame(animationRef.current);
        };
    }, [points, animationState, theme]);

    const addPoint = () => {
        const x = parseFloat(xInput);
        const y = parseFloat(yInput);
        if (!isNaN(x) && !isNaN(y)) {
            setPoints((prev) => [...prev, { x, y }]);
            setXInput("");
            setYInput("");
        }
    };

    const removePoint = (index: number) => {
        setPoints(prev => prev.filter((_, i) => i !== index));
    };

    const toggleAnimation = (chart: keyof typeof animationState) => {
        setAnimationState(prev => ({
            ...prev,
            [chart]: prev[chart] === 'playing' ? 'paused' : 'playing'
        }));
    };

    const resetPoints = () => {
        setPoints([
            { x: 1, y: 1 },
            { x: 2, y: 2.3 },
            { x: 3, y: 2.7 },
            { x: 4, y: 3.8 },
            { x: 5, y: 5 },
        ]);
        // Reset all accuracies when points are reset
        setShowAccuracy({ linear: false, nn: false, cnn: false });
    };

    const highlightModel = (model: string) => {
        setActiveModel(model);
        setTimeout(() => setActiveModel(null), 2000);
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
                    Model Comparison
                </h1>


                <div className="flex flex-wrap justify-center gap-3 mb-6">
                    <input
                        type="number"
                        placeholder="X value"
                        value={xInput}
                        onChange={(e) => setXInput(e.target.value)}
                        className="border rounded-md px-3 py-2 bg-transparent border-gray-400"
                    />
                    <input
                        type="number"
                        placeholder="Y value"
                        value={yInput}
                        onChange={(e) => setYInput(e.target.value)}
                        className="border rounded-md px-3 py-2 bg-transparent border-gray-400"
                    />
                    <button
                        onClick={addPoint}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Add Point
                    </button>
                    <button
                        onClick={resetPoints}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <FaRedo /> Reset
                    </button>
                </div>


                <div className="mb-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">Current Data Points:</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {points.map((point, index) => (
                            <div
                                key={index}
                                className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}
                            >
                                ({point.x}, {point.y})
                                <button
                                    onClick={() => removePoint(index)}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                    <div
                        className={`rounded-xl shadow-lg p-4 border transition-all duration-300 ${theme === "dark"
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                            } ${activeModel === 'linear' ? 'ring-4 ring-blue-500 scale-105' : ''}`}
                    >
                        <div
                            className={`flex justify-between items-center mb-2 ${theme === "dark" ? "text-white/70" : "text-black/70"
                                }`}
                        >

                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FaChartLine className="text-blue-500" /> Linear Regression
                            </h2>
                            <button
                                onClick={() => {
                                    toggleAnimation('linear');
                                    highlightModel('linear');
                                }}
                                className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {animationState.linear === 'playing' ? <FaPause /> : <FaPlay />}
                            </button>
                        </div>
                        <canvas ref={linearChartRef} height={200}></canvas>


                        <div
                            className={`mt-4 p-3 bg-gray-700 rounded-lg ${theme === "dark" ? "text-white/70" : "text-black/70"
                                }`}
                        >

                            <h3 className="font-semibold flex items-center gap-2 text-blue-300">
                                <FaCalculator /> Regression Calculations
                            </h3>
                            <div className="text-xs space-y-1 mt-2">
                                <p className="text-white " >Slope (m): <span className="text-green-500">{calculations.slope.toFixed(3)}</span></p>
                                <p className="text-white " >Intercept (b): <span className="text-orange-500">{calculations.intercept.toFixed(3)}</span></p>
                                
                                <p className="text-white " >Training Progress: <span className="text-blue-500">{(linearProgress * 100).toFixed(0)}%</span></p>
                                <p className="text-white " >Equation: <span className="text-purple-500"> y = {calculations.slope.toFixed(3)}x + {calculations.intercept.toFixed(3)}</span></p>
                                <p className="text-white " >R²: <span className="text-yellow-500">{calculations.rSquared.toFixed(4)}</span></p>
                                <p className="text-white " >MSE: <span className="text-red-500">{calculations.mse.toFixed(4)}</span></p>
                                {showAccuracy.linear && (
                                    <p className="text-white">Accuracy: <span className="text-blue-400">{linearAccuracy.toFixed(2)}%</span></p>
                                )}
                            </div>
                        </div>
                    </div>


                    <div
                        className={`rounded-xl shadow-lg p-4 border transition-all duration-300 ${theme === "dark"
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                            } ${activeModel === 'nn' ? 'ring-4 ring-yellow-500 scale-105' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FaBrain className="text-yellow-500" /> Neural Network
                            </h2>
                            <button
                                onClick={() => {
                                    toggleAnimation('nn');
                                    highlightModel('nn');
                                }}
                                className="bg-yellow-600 text-white p-2 rounded-md hover:bg-yellow-700 transition-colors"
                            >
                                {animationState.nn === 'playing' ? <FaPause /> : <FaPlay />}
                            </button>
                        </div>
                        <canvas ref={nnChartRef} height={200}></canvas>


                        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                            <h3 className="font-semibold flex items-center gap-2 text-yellow-300">
                                <FaCalculator /> Neural Network Learning
                            </h3>
                            <div className="text-xs space-y-1 mt-2">
                                <p className="text-white ">Learning Rate: <span className="text-green-500">0.001</span></p>
                                <p className="text-white ">Epochs: <span className="text-orange-500">{(nnProgress * 1000).toFixed(0)}</span></p>
                                
                                <p className="text-white " >Training Progress: <span className="text-yellow-500">{(nnProgress * 100).toFixed(0)}%</span></p>
                                <p className="text-white ">Activation: <span className="text-purple-500">ReLU/Sigmoid</span></p>
                                <p className="text-white " >Layers: <span className="text-yellow-500">3 Hidden</span></p>
                                <p className="text-white ">Loss: <span className="text-red-500">{(1 - nnProgress).toFixed(3)}</span></p>
                                {showAccuracy.nn && (
                                    <p className="text-white">Accuracy: <span className="text-yellow-400">{nnAccuracy.toFixed(2)}%</span></p>
                                )}
                            </div>
                        </div>
                    </div>


                    <div
                        className={`rounded-xl shadow-lg p-4 border transition-all duration-300 ${theme === "dark"
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                            } ${activeModel === 'cnn' ? 'ring-4 ring-green-500 scale-105' : ''}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FaNetworkWired className="text-green-500" /> CNN
                            </h2>
                            <button
                                onClick={() => {
                                    toggleAnimation('cnn');
                                    highlightModel('cnn');
                                }}
                                className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
                            >
                                {animationState.cnn === 'playing' ? <FaPause /> : <FaPlay />}
                            </button>
                        </div>
                        <canvas ref={cnnChartRef} height={200}></canvas>


                        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                            <h3 className="font-semibold flex items-center gap-2 text-green-300">
                                <FaCalculator /> CNN Feature Learning
                            </h3>
                            <div className="text-xs space-y-1 mt-2">
                                <p className="text-white ">Convolution Layers: <span className="text-green-500">2</span></p>
                                <p className="text-white ">Kernel Size: <span className="text-orange-500">3×3</span></p>
                                <p className="text-white ">Feature Maps: <span className="text-purple-500">32, 64</span></p>
                                <p className="text-white">Pooling: <span className="text-yellow-500">MaxPool 2×2</span></p>
                                
                                <p className="text-white " >Training Progress: <span className="text-green-500">{(cnnProgress * 100).toFixed(0)}%</span></p>
                                {showAccuracy.cnn && (
                                    <p className="text-white">Accuracy: <span className="text-green-400">{cnnAccuracy.toFixed(2)}%</span></p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                <div className="grid md:grid-cols-3 gap-6">
                    <div className={`rounded-xl p-5 transition-all duration-300 ${theme === "dark"
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                        }`}>
                        <h3 className="text-lg font-semibold text-blue-500 mb-2">Linear Regression</h3>
                        <p className="text-sm mb-3">
                            Finds the best-fit line (Y = mX + b) using Ordinary Least Squares to minimize the sum of squared errors.
                        </p>
                        <div className="text-xs space-y-1">
                            <p>• Cost Function: MSE = 1/n ∑(yᵢ - ŷᵢ)²</p>
                            <p>• Gradient: ∂/∂m = -2/n ∑xᵢ(yᵢ - ŷᵢ)</p>
                            <p>• Closed Form: m = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²</p>
                            <p>• R² measures goodness of fit (0-1)</p>
                        </div>
                    </div>

                    <div className={`rounded-xl p-5 transition-all duration-300 ${theme === "dark"
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                        }`}>
                        <h3 className="text-lg font-semibold text-yellow-500 mb-2">Neural Network</h3>
                        <p className="text-sm mb-3">
                            Multi-layer perceptron with non-linear activation functions for complex pattern recognition.
                        </p>
                        <div className="text-xs  space-y-1">
                            <p>• Forward: a⁽ˡ⁾ = σ(w⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾)</p>
                            <p>• Backprop: δ⁽ˡ⁾ = (w⁽ˡ⁺¹⁾)ᵀδ⁽ˡ⁺¹⁾ ⊙ σ'(z⁽ˡ⁾)</p>
                            <p>• Update: w = w - η ∇w J(w,b)</p>
                            <p>• Learning rate η controls step size</p>
                        </div>
                    </div>

                    <div className={`rounded-xl p-5 transition-all duration-300 ${theme === "dark"
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                        }`}>
                        <h3 className="text-lg font-semibold text-green-500 mb-2">Convolutional Neural Network</h3>
                        <p className="text-sm mb-3">
                            Specialized for spatial data using convolutional layers to detect hierarchical patterns.
                        </p>
                        <div className="text-xs  space-y-1">
                            <p>• Conv: O[i,j] = ∑∑ I[i+m,j+n] ⋅ K[m,n]</p>
                            <p>• Pooling: Reduce spatial dimensions</p>
                            <p>• Feature Hierarchy: Edges → Textures → Objects</p>
                            <p>• Parameter sharing reduces overfitting</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}