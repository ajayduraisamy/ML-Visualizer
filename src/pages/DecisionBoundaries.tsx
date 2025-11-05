import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

type Label = "A" | "B";
type Point = { x: number; y: number; label: Label };

const GRID_COLS = 80;
const GRID_ROWS = 60;
const PADDING = 40;

// Helper component for blue formula boxes
const FormulaBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 my-2 text-sm overflow-x-auto dark:bg-gray-700 dark:border-gray-600 dark:text-blue-200">
        <code className="whitespace-pre-wrap">{children}</code>
    </div>
);

function sigmoid(z: number) {
    return 1 / (1 + Math.exp(-z));
}

// Euclidean distance
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export default function DecisionBoundariesPage() {
    const { theme } = useTheme();

    const [algorithm, setAlgorithm] = useState<"KNN" | "SVM" | "Logistic">("Logistic");
    const [points, setPoints] = useState<Point[]>([
        { x: 1, y: 1, label: "A" },
        { x: 2, y: 2, label: "A" },
        { x: 3, y: 3, label: "A" },
        { x: 1, y: 3, label: "B" },
        { x: 2, y: 1, label: "B" },
        { x: 3, y: 1, label: "B" },
        { x: 4, y: 4, label: "A" },
    ]);
    const [kValue, setKValue] = useState<number>(5);
    const [svmW1, setSvmW1] = useState<number>(1.0);
    const [svmW2, setSvmW2] = useState<number>(1.0);
    const [svmB, setSvmB] = useState<number>(-2.0);
    // 6 weights for [bias, x, y, x², xy, y²]
    const [logW, setLogW] = useState<number[]>(Array.from({ length: 6 }, (_, i) => (i === 0 ? -2.0 : 0.5)));
    const [formX, setFormX] = useState<string>("");
    const [formY, setFormY] = useState<string>("");
    const [formLabel, setFormLabel] = useState<Label>("A");
    const [hoverCoords, setHoverCoords] = useState<{ x: number, y: number } | null>(null);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);

    const getDomain = useCallback(() => {
        if (points.length === 0) return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };

        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);

        let xMin = Math.min(0, ...xs);
        let xMax = Math.max(10, ...xs);
        let yMin = Math.min(0, ...ys);
        let yMax = Math.max(10, ...ys);

        const xRange = xMax - xMin || 10;
        const yRange = yMax - yMin || 10;

        xMin -= xRange * 0.1;
        xMax += xRange * 0.1;
        yMin -= yRange * 0.1;
        yMax += yRange * 0.1;

        return { xMin, xMax, yMin, yMax };
    }, [points]);

    const domain = getDomain();

    const dataToPixel = (x: number, y: number, width: number, height: number) => {
        const { xMin, xMax, yMin, yMax } = domain;
        const plotW = width - PADDING * 2;
        const plotH = height - PADDING * 2;
        const px = PADDING + ((x - xMin) / (xMax - xMin)) * plotW;
        const py = PADDING + ((yMax - y) / (yMax - yMin)) * plotH;
        return { px, py };
    };

    const pixelToData = (px: number, py: number, width: number, height: number) => {
        const { xMin, xMax, yMin, yMax } = domain;
        const plotW = width - PADDING * 2;
        const plotH = height - PADDING * 2;
        const x = xMin + ((px - PADDING) / plotW) * (xMax - xMin);
        const y = yMax - ((py - PADDING) / plotH) * (yMax - yMin);
        return { x, y };
    };

    const classifyGrid = useCallback(
        (gx: number, gy: number): Label => {
            if (algorithm === "KNN") {
                if (points.length === 0) return "A";
                const distances = points
                    .map((p) => ({ p, d: dist({ x: gx, y: gy }, p) }))
                    .sort((a, b) => a.d - b.d);

                // Handle fractional k during animation
                const kFractional = Math.max(1, Math.min(points.length, kValue));
                const kFloor = Math.floor(kFractional);
                const kCeil = Math.ceil(kFractional);
                const weight = kFractional - kFloor;

                const votesFloor = { A: 0, B: 0 };
                const votesCeil = { A: 0, B: 0 };

                for (let i = 0; i < kFloor; i++) {
                    votesFloor[distances[i].p.label]++;
                }
                for (let i = 0; i < kCeil; i++) {
                    votesCeil[distances[i].p.label]++;
                }

                // Interpolate between floor and ceil k values
                const aVotes = votesFloor.A * (1 - weight) + votesCeil.A * weight;
                const bVotes = votesFloor.B * (1 - weight) + votesCeil.B * weight;

                return aVotes >= bVotes ? "A" : "B";
            } else if (algorithm === "SVM") {
                const f = svmW1 * gx + svmW2 * gy + svmB;
                return f >= 0 ? "A" : "B";
            } else {
                // Logistic Regression (Degree 2)
                const features = [1, gx, gy, gx * gx, gx * gy, gy * gy];
                let z = 0;
                for (let i = 0; i < logW.length; i++) {
                    z += (logW[i] || 0) * features[i];
                }
                const p = sigmoid(z);
                return p >= 0.5 ? "A" : "B";
            }
        },
        [algorithm, kValue, points, svmW1, svmW2, svmB, logW]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // Background with theme
        ctx.fillStyle = theme === "dark" ? "#0f172a" : "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const { xMin, xMax, yMin, yMax } = domain;
        const plotW = width - PADDING * 2;
        const plotH = height - PADDING * 2;

        // Border box with theme
        ctx.strokeStyle = theme === "dark" ? "#475569" : "#334155";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(PADDING, PADDING, plotW, plotH);

        // Grid and decision colors
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const gx = xMin + (c / (GRID_COLS - 1)) * (xMax - xMin);
                const gy = yMax - (r / (GRID_ROWS - 1)) * (yMax - yMin);
                const label = classifyGrid(gx, gy);
                const px = PADDING + (c / (GRID_COLS - 1)) * plotW;
                const py = PADDING + (r / (GRID_ROWS - 1)) * plotH;
                ctx.beginPath();
                ctx.arc(px, py, 2.8, 0, Math.PI * 2);
                ctx.fillStyle = label === "A" ? "rgba(59,130,246,0.25)" : "rgba(16,185,129,0.25)";
                ctx.fill();
            }
        }

        // Axis ticks with theme
        ctx.fillStyle = theme === "dark" ? "#94a3b8" : "#475569";
        ctx.font = "12px Inter";
        ctx.textAlign = "center";
        for (let i = 0; i <= 5; i++) {
            const val = xMin + (i / 5) * (xMax - xMin);
            const { px } = dataToPixel(val, yMin, width, height);
            ctx.fillText(val.toFixed(0), px, PADDING + plotH + 10);
        }

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (let i = 0; i <= 5; i++) {
            const val = yMin + (i / 5) * (yMax - yMin);
            const { py } = dataToPixel(xMin, val, width, height);
            ctx.fillText(val.toFixed(0), PADDING - 8, py);
        }

        // Draw actual class points
        for (const p of points) {
            const { px, py } = dataToPixel(p.x, p.y, width, height);
            ctx.beginPath();
            ctx.arc(px, py, 7, 0, Math.PI * 2);
            ctx.fillStyle = p.label === "A" ? "#2563eb" : "#10b981";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = theme === "dark" ? "#1e293b" : "#ffffff";
            ctx.stroke();
        }

        // Class labels with theme
        ctx.font = "13px Inter";
        ctx.textAlign = "center"; // Centered legend text
        ctx.fillStyle = "#2563eb";
        ctx.fillText("Class A Points", PADDING + 60, PADDING + plotH + 32);
        ctx.fillStyle = "#10b981";
        ctx.fillText("Class B Points", PADDING + 180, PADDING + plotH + 32);

        // Display hover coordinates
        if (hoverCoords) {
            ctx.fillStyle = theme === "dark" ? "#f1f5f9" : "#1e293b";
            ctx.font = "12px Inter";
            ctx.textAlign = "left";
            ctx.fillText(`(${hoverCoords.x.toFixed(2)}, ${hoverCoords.y.toFixed(2)})`, 10, 20);
        }

        // Decision boundary contour for logistic / svm
        if (algorithm === "Logistic") {
            ctx.strokeStyle = "#0ea5e9"; // Blue for Logistic
            ctx.lineWidth = 1.8;
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const gx = xMin + (c / (GRID_COLS - 1)) * (xMax - xMin);
                    const gy = yMax - (r / (GRID_ROWS - 1)) * (yMax - yMin);
                    const features = [1, gx, gy, gx * gx, gx * gy, gy * gy];
                    let z = 0;
                    for (let i = 0; i < logW.length; i++) z += (logW[i] || 0) * features[i];
                    const p = sigmoid(z);

                    // Draw contour where probability is 0.5
                    if (Math.abs(p - 0.5) < 0.05) {
                        const px = PADDING + (c / (GRID_COLS - 1)) * plotW;
                        const py = PADDING + (r / (GRID_ROWS - 1)) * plotH;
                        ctx.beginPath();
                        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                        ctx.fillStyle = "#0ea5e9";
                        ctx.fill();
                    }
                }
            }
        } else if (algorithm === "SVM") {
            ctx.strokeStyle = "#e11d48"; // Red for SVM
            ctx.lineWidth = 1.8;
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const gx = xMin + (c / (GRID_COLS - 1)) * (xMax - xMin);
                    const gy = yMax - (r / (GRID_ROWS - 1)) * (yMax - yMin);

                    // Use the SVM decision function
                    const f = svmW1 * gx + svmW2 * gy + svmB;

                    // Draw contour where f is 0
                    if (Math.abs(f) < 0.08) { // Use a small threshold
                        const px = PADDING + (c / (GRID_COLS - 1)) * plotW;
                        const py = PADDING + (r / (GRID_ROWS - 1)) * plotH;
                        ctx.beginPath();
                        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                        ctx.fillStyle = "#e11d48";
                        ctx.fill();
                    }
                }
            }
        }
    }, [points, classifyGrid, algorithm, theme, kValue, svmW1, svmW2, svmB, logW, domain, hoverCoords]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const width = (e.target as HTMLCanvasElement).clientWidth;
        const height = (e.target as HTMLCanvasElement).clientHeight;

        const xPx = e.clientX - rect.left;
        const yPx = e.clientY - rect.top;

        const { x, y } = pixelToData(xPx, yPx, width, height);

        if (xPx > PADDING && xPx < width - PADDING && yPx > PADDING && yPx < height - PADDING) {
            if (isFinite(x) && isFinite(y)) {
                setPoints((p) => [
                    ...p,
                    { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), label: formLabel },
                ]);
            }
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const width = (e.target as HTMLCanvasElement).clientWidth;
        const height = (e.target as HTMLCanvasElement).clientHeight;

        const xPx = e.clientX - rect.left;
        const yPx = e.clientY - rect.top;

        if (xPx > PADDING && xPx < width - PADDING && yPx > PADDING && yPx < height - PADDING) {
            const { x, y } = pixelToData(xPx, yPx, width, height);
            setHoverCoords({ x, y });
        } else {
            setHoverCoords(null);
        }
    };

    const handleCanvasMouseLeave = () => {
        setHoverCoords(null);
    };

    const addFromForm = () => {
        const x = parseFloat(formX);
        const y = parseFloat(formY);
        if (Number.isFinite(x) && Number.isFinite(y)) {
            setPoints((p) => [...p, { x: x, y: y, label: formLabel }]);
            setFormX("");
            setFormY("");
        }
    };

    const clearData = () => {
        setPoints([]);
    };

    // FIXED: Improved animation with smoother transitions
    const animateBoundary = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        const duration = 2000;
        let startTime: number | null = null;

        // Store initial values
        const initialK = kValue;
        const initialSvmW1 = svmW1;
        const initialSvmW2 = svmW2;
        const initialSvmB = svmB;
        const initialLogW = [...logW];

        // Calculate target values based on current data
        let targetK = initialK;
        let targetSvmW1 = initialSvmW1;
        let targetSvmW2 = initialSvmW2;
        let targetSvmB = initialSvmB;
        let targetLogW = [...initialLogW];

        // Calculate targets based on data distribution
        const aPts = points.filter((p) => p.label === "A");
        const bPts = points.filter((p) => p.label === "B");

        if (aPts.length && bPts.length) {
            const aCx = aPts.reduce((s, p) => s + p.x, 0) / aPts.length;
            const aCy = aPts.reduce((s, p) => s + p.y, 0) / aPts.length;
            const bCx = bPts.reduce((s, p) => s + p.x, 0) / bPts.length;
            const bCy = bPts.reduce((s, p) => s + p.y, 0) / bPts.length;

            // For KNN: use fractional k for smoother animation
            targetK = Math.max(1, Math.min(15, Math.sqrt(points.length) || 3));

            // For SVM: target weights pointing from class B to class A
            targetSvmW1 = aCx - bCx;
            targetSvmW2 = aCy - bCy;
            targetSvmB = -((targetSvmW1 * (aCx + bCx) / 2) + (targetSvmW2 * (aCy + bCy) / 2));

            // Normalize SVM weights for better visualization
            const svmNorm = Math.sqrt(targetSvmW1 * targetSvmW1 + targetSvmW2 * targetSvmW2) || 1;
            targetSvmW1 /= svmNorm * 0.5;
            targetSvmW2 /= svmNorm * 0.5;

            // For Logistic: more reasonable weights
            targetLogW = [
                -2.5, // bias
                targetSvmW1 * 0.8, // x coefficient
                targetSvmW2 * 0.8, // y coefficient
                0.3, // x² coefficient
                0.1, // xy coefficient  
                0.3 // y² coefficient
            ];
        }

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Smoother easing function
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            if (algorithm === "KNN") {
                // FIXED: Use fractional k during animation for smoother transitions
                const newK = initialK + (targetK - initialK) * easeProgress;
                setKValue(newK); // Keep as float during animation
            } else if (algorithm === "SVM") {
                setSvmW1(initialSvmW1 + (targetSvmW1 - initialSvmW1) * easeProgress);
                setSvmW2(initialSvmW2 + (targetSvmW2 - initialSvmW2) * easeProgress);
                setSvmB(initialSvmB + (targetSvmB - initialSvmB) * easeProgress);
            } else if (algorithm === "Logistic") {
                const newWeights = initialLogW.map((initial, i) =>
                    initial + (targetLogW[i] - initial) * easeProgress
                );
                setLogW(newWeights);
            }

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Final cleanup - round K value for KNN
                if (algorithm === "KNN") {
                    setKValue(Math.round(targetK));
                }
                setIsAnimating(false);
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // Clean up animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const setLogWAt = (i: number, value: number) => {
        setLogW((prev) => prev.map((v, idx) => (idx === i ? value : v)));
    };

    return (
        <div
            className={`p-6 max-w-[1200px] mx-auto min-h-screen ${theme === "dark"
                ? "bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white"
                : "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-black"
                }`}
        >
            <header className="text-center mb-6 mt-14">
                <h1 className="text-2xl font-semibold text-center">Decision Boundary Visualizer</h1>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* LEFT COLUMN - PARAMETERS */}
                <div className={`col-span-12 md:col-span-4 border rounded-lg p-5 shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <h2 className="font-bold mb-3">Algorithm Parameters</h2>

                    <label className="text-sm block mb-2">Algorithm:</label>
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className={`w-full mb-4 p-2 border rounded ${theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                            }`}
                    >
                        <option value="Logistic">Logistic Regression (Polynomial)</option>
                        <option value="SVM">Support Vector Machine (Linear)</option>
                        <option value="KNN">K-Nearest Neighbors</option>
                    </select>

                    {algorithm === "KNN" && (
                        <>
                            <label className="text-sm">
                                K value: {isAnimating ? kValue.toFixed(2) : Math.round(kValue)}
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={15}
                                step={0.1}
                                value={kValue}
                                onChange={(e) => setKValue(Number(e.target.value))}
                                className="w-full mt-3"
                            />
                            <div className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                Higher K = smoother boundary, Lower K = more complex boundary
                            </div>
                        </>
                    )}

                    {algorithm === "SVM" && (
                        <>
                            <label className="text-sm">Weight w1: {svmW1.toFixed(2)}</label>
                            <input
                                type="range"
                                min={-5}
                                max={5}
                                step={0.1}
                                value={svmW1}
                                onChange={(e) => setSvmW1(Number(e.target.value))}
                                className="w-full mt-3"
                            />
                            <label className="text-sm mt-3">Weight w2: {svmW2.toFixed(2)}</label>
                            <input
                                type="range"
                                min={-5}
                                max={5}
                                step={0.1}
                                value={svmW2}
                                onChange={(e) => setSvmW2(Number(e.target.value))}
                                className="w-full mt-3"
                            />
                            <label className="text-sm mt-3">Bias: {svmB.toFixed(2)}</label>
                            <input
                                type="range"
                                min={-10}
                                max={10}
                                step={0.1}
                                value={svmB}
                                onChange={(e) => setSvmB(Number(e.target.value))}
                                className="w-full mt-3 mb-4"
                            />
                        </>
                    )}

                    {algorithm === "Logistic" && (
                        <>
                            <div className={`text-sm mb-2 font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>
                                Polynomial Degree 2 Weights
                            </div>
                            <div className={`text-xs mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                                }`}>
                                (bias, x, y, x², xy, y²)
                            </div>
                            <div className="space-y-2">
                                {logW.map((w, i) => (
                                    <div key={i}>
                                        <label className="text-sm">
                                            w{i}: {w.toFixed(2)}
                                        </label>
                                        <input
                                            type="range"
                                            min={-6}
                                            max={6}
                                            step={0.05}
                                            value={w}
                                            onChange={(e) => setLogWAt(i, Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <button
                        onClick={animateBoundary}
                        disabled={isAnimating}
                        className={`mt-5 w-full py-2 rounded shadow transition-colors ${isAnimating
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                    >
                        {isAnimating ? "Animating..." : "Animate Boundary"}
                    </button>

                    {isAnimating && (
                        <div className="mt-3 text-sm text-blue-600 text-center">
                            Adjusting {algorithm} parameters to fit the data...
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - CHART */}
                <div className={`col-span-12 md:col-span-8 border rounded-lg p-5 shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseLeave={handleCanvasMouseLeave}
                        className="w-full h-[400px] cursor-crosshair"
                    />
                    {hoverCoords && (
                        <div className={`text-sm mt-3 text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`}>
                            Hover: ({hoverCoords.x.toFixed(2)}, {hoverCoords.y.toFixed(2)})
                        </div>
                    )}
                </div>
            </div>

            {/* ================================================================= */}
            {/* NEW "ADD POINT" FORM SECTION - MOVED HERE TO MATCH SCREENSHOT */}
            {/* ================================================================= */}
            <div className={`border rounded-lg p-5 shadow-sm my-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        placeholder="X value"
                        value={formX}
                        onChange={(e) => setFormX(e.target.value)}
                        className={`p-2 border rounded w-full md:w-40 ${theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300"
                            }`}
                    />
                    <input
                        placeholder="Y value"
                        value={formY}
                        onChange={(e) => setFormY(e.target.value)}
                        className={`p-2 border rounded w-full md:w-40 ${theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                            : "bg-white border-gray-300"
                            }`}
                    />
                    <select
                        className={`p-2 border rounded ${theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300"
                            }`}
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value as Label)}
                    >
                        <option value="A">Class A</option>
                        <option value="B">Class B</option>
                    </select>

                    <button
                        onClick={addFromForm}
                        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                        Add Point
                    </button>
                    <button
                        onClick={clearData}
                        className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
                    >
                        Clear Data
                    </button>
                </div>
            </div>

            {/* ================================================================= */}
            {/* All cards below */}
            {/* ================================================================= */}
            <div className="space-y-6"> {/* Removed mt-6, now handled by form margin */}
                {/* HOW IT WORKS */}
                <div className={`border rounded-lg p-5 shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <h3 className="font-semibold mb-3">How Decision Boundaries Work</h3>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                        <li>This visualizer shows how different algorithms partition the 2D feature space.</li>
                        <li>Each algorithm learns from the data points to create a classification model.</li>
                        <li>The background color (blue/green) represents the "decision region" for that class.</li>
                        <li>The decision boundary is the line or curve where the classification changes from Class A to Class B.</li>
                    </ol>
                </div>

                {/* DATA POINTS - NOW ONLY CONTAINS THE TABLE */}
                <div className={`border rounded-lg p-5 shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <h3 className="font-semibold mb-3">Data Points</h3>

                    {/* The form was removed from here */}

                    <div className="overflow-x-auto max-h-60 border rounded dark:border-gray-600">
                        <table className="w-full text-left">
                            <thead className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                                }`}>
                                <tr className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                    }`}>
                                    <th className="py-2 px-3">X</th>
                                    <th className="py-2 px-3">Y</th>
                                    <th className="py-2 px-3">Class</th>
                                </tr>
                            </thead>
                            <tbody>
                                {points.map((p, i) => (
                                    <tr key={i} className={`border-t ${theme === "dark"
                                        ? "odd:bg-gray-700/50 even:bg-gray-800/50 border-gray-700"
                                        : "odd:bg-gray-50 border-gray-200"
                                        }`}>
                                        <td className="py-2 px-3">{p.x}</td>
                                        <td className="py-2 px-3">{p.y}</td>
                                        <td className="py-2 px-3">{p.label}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ALGORITHMS EXPLAINED */}
                <div className={`border rounded-lg p-5 shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <h3 className="font-bold mb-3">Classification Algorithms Explained</h3>
                    <div className={`text-sm space-y-6 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>

                        {/* KNN EXPLANATION */}
                        <div>
                            <h4 className="font-bold">K-Nearest Neighbors (KNN)</h4>
                            <p>
                                KNN is a non-parametric algorithm that classifies new data points based on the majority class of their 'k' nearest neighbors in the training data.
                            </p>

                            <h5 className="font-bold mt-3">Distance Calculation</h5>
                            <p>It typically uses Euclidean distance to find the 'nearest' points.</p>
                            <FormulaBox>
                                {`Distance = sqrt( (x₂ - x₁)² + (y₂ - y₁)² )`}
                            </FormulaBox>

                            <h5 className="font-bold mt-3">Neighborhood Selection</h5>
                            <p>The algorithm identifies the 'k' data points from the training set that are closest to the new point.</p>

                            <h5 className="font-bold mt-3">Majority Voting</h5>
                            <p>The new point is assigned to the class that is most common among its 'k' nearest neighbors.</p>

                            <h5 className="font-bold mt-3">Decision Boundary</h5>
                            <p>The boundary in KNN is created by the points where the majority vote changes. It's often complex and irregular, adapting to the local data distribution.</p>
                        </div>

                        {/* SVM EXPLANATION */}
                        <div>
                            <h4 className="font-bold">Support Vector Machine (Linear)</h4>
                            <p>
                                A linear SVM tries to find the optimal "hyperplane" (a line in 2D) that best separates the two classes with the maximum possible margin.
                            </p>

                            <h5 className="font-bold mt-3">Linear Decision Function</h5>
                            <p>The function for the line is defined by weights (w) and a bias (b).</p>
                            <FormulaBox>
                                {`f(x) = w₁x₁ + w₂x₂ + b = wᵀx + b`}
                            </FormulaBox>

                            <h5 className="font-bold mt-3">Margin / Gutter</h5>
                            <p>The SVM aims to maximize the distance between the decision line and the closest points from either class (the "support vectors"). These gutters are defined by:</p>
                            <FormulaBox>
                                {`wᵀx + b = 1  (for Class A support vectors)
wᵀx + b = -1 (for Class B support vectors)`}
                            </FormulaBox>

                            <h5 className="font-medium mt-3">Class Prediction</h5>
                            <p>A new point is classified based on which side of the line it falls on.</p>
                            <FormulaBox>
                                {`IF f(x) ≥ 0, classify as Class A
IF f(x) < 0, classify as Class B`}
                            </FormulaBox>

                            <h5 className="font-medium mt-3">Decision Boundary Equation</h5>
                            <p>The boundary itself is the line where the decision function is exactly zero.</p>
                            <FormulaBox>
                                {`f(x) = w₁x₁ + w₂x₂ + b = 0`}
                            </FormulaBox>
                        </div>

                        {/* LOGISTIC REGRESSION EXPLANATION */}
                        <div>
                            <h4 className="font-bold">Logistic Regression (Polynomial)</h4>
                            <p>
                                Logistic Regression models the probability that a point belongs to a class. By using polynomial features, it can create non-linear decision boundaries.
                            </p>

                            <h5 className="font-bold mt-3">Feature Transformation</h5>
                            <p>We expand our features (x, y) into a higher-dimensional space. For degree 2:</p>
                            <FormulaBox>
                                {`φ(x) = [1, x₁, x₂, x₁², x₁x₂, x₂²]`}
                            </FormulaBox>

                            <h5 className="font-bold mt-3">Linear Combination (z)</h5>
                            <p>A linear combination is computed in this new feature space using weights (w).</p>
                            <FormulaBox>
                                {`z = w₀ + w₁x₁ + w₂x₂ + w₃x₁² + w₄x₁x₂ + w₅x₂²`}
                            </FormulaBox>

                            <h5 className="font-bold mt-3">Sigmoid Transformation</h5>
                            <p>The 'z' value is passed through the sigmoid function to map it to a probability between 0 and 1.</p>
                            <FormulaBox>
                                {`p = σ(z) = 1 / (1 + e⁻ᶻ)`}
                            </FormulaBox>

                            <h5 className="font-bold mt-3">Decision Rule</h5>
                            <p>We classify based on a probability threshold, typically 0.5.</p>
                            <FormulaBox>
                                {`IF p(z) ≥ 0.5, classify as Class A
IF p(z) < 0.5, classify as Class B`}
                            </FormulaBox>

                            <h5 className="font-bold mt-3">Boundary Characteristics</h5>
                            <p>The boundary occurs where p(z) = 0.5, which happens when z = 0. This creates a quadratic shape (like a circle, ellipse, or parabola).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}