import React, { useCallback, useEffect, useRef, useState } from "react";

type Label = "A" | "B";
type Point = { x: number; y: number; label: Label };

const WIDTH = 640;
const HEIGHT = 400;
const GRID_COLS = 60; // resolution for decision grid
const GRID_ROWS = 40;
const PADDING = 40; // canvas padding

// Helper component for blue formula boxes
const FormulaBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 my-2 text-sm overflow-x-auto">
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
    const theme = "light";

    const [algorithm, setAlgorithm] = useState<"KNN" | "SVM" | "Logistic">(
        "Logistic"
    );

    // Data points
    const [points, setPoints] = useState<Point[]>([
        { x: 1, y: 1, label: "A" },
        { x: 2, y: 2, label: "A" },
        { x: 3, y: 3, label: "A" },
        { x: 1, y: 3, label: "B" },
        { x: 2, y: 1, label: "B" },
        { x: 3, y: 1, label: "B" },
        { x: 4, y: 4, label: "A" },
    ]);

    // KNN param
    const [kValue, setKValue] = useState<number>(5);

    // SVM params (linear)
    const [svmW1, setSvmW1] = useState<number>(1.0);
    const [svmW2, setSvmW2] = useState<number>(1.0);
    const [svmB, setSvmB] = useState<number>(-2.0);

    // Logistic (polynomial degree 2): features [1, x, y, x^2, xy, y^2]
    const [logW, setLogW] = useState<number[]>(
        Array.from({ length: 6 }, (_, i) => (i === 0 ? -2.0 : 0.5))
    );
    const [polyDegree, setPolyDegree] = useState<number>(2);

    // Form inputs
    const [formX, setFormX] = useState<string>("");
    const [formY, setFormY] = useState<string>("");
    const [formLabel, setFormLabel] = useState<Label>("A");

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // ==========================================================
    // --- NEW: AUTO-SCALING DOMAIN LOGIC ---
    // ==========================================================
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

        // Add 10% padding
        xMin -= xRange * 0.1;
        xMax += xRange * 0.1;
        yMin -= yRange * 0.1;
        yMax += yRange * 0.1;

        return { xMin, xMax, yMin, yMax };
    }, [points]);

    const domain = getDomain();

    // Mapping functions
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

    // Compute classification for a grid point
    const classifyGrid = useCallback(
        (gx: number, gy: number): Label => {
            if (algorithm === "KNN") {
                if (points.length === 0) return "A";
                const distances = points
                    .map((p) => ({ p, d: dist({ x: gx, y: gy }, p) }))
                    .sort((a, b) => a.d - b.d);
                const k = Math.max(1, Math.min(points.length, Math.round(kValue)));
                const votes = { A: 0, B: 0 };
                for (let i = 0; i < k; i++) {
                    votes[distances[i].p.label]++;
                }
                return votes.A >= votes.B ? "A" : "B";
            } else if (algorithm === "SVM") {
                const f = svmW1 * gx + svmW2 * gy + svmB;
                return f >= 0 ? "A" : "B";
            } else {
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

    // Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width * (window.devicePixelRatio || 1);
        canvas.height = height * (window.devicePixelRatio || 1);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // background
        ctx.fillStyle = theme === "dark" ? "#0b1220" : "#ffffff";
        ctx.fillRect(0, 0, width, height);

        const { xMin, xMax, yMin, yMax } = domain;
        const plotW = width - PADDING * 2;
        const plotH = height - PADDING * 2;

        // axes box
        ctx.strokeStyle = theme === "dark" ? "#44556a" : "#e6eef8";
        ctx.lineWidth = 1;
        ctx.strokeRect(PADDING, PADDING, plotW, plotH);

        // iterate over grid cells
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                // map c,r to data coordinates
                const gx = xMin + (c / (GRID_COLS - 1)) * (xMax - xMin);
                const gy = yMax - (r / (GRID_ROWS - 1)) * (yMax - yMin); // invert y

                const label = classifyGrid(gx, gy);

                // map c,r to pixel coordinates
                const px = PADDING + (c / (GRID_COLS - 1)) * plotW;
                const py = PADDING + (r / (GRID_ROWS - 1)) * plotH;

                // small dot
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fillStyle = label === "A" ? "rgba(59,130,246,0.18)" : "rgba(16,185,129,0.18)";
                ctx.fill();
            }
        }

        // axes ticks and labels
        ctx.fillStyle = theme === "dark" ? "#cbd5e1" : "#334155";
        ctx.font = "12px Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        // X-Axis labels
        for (let i = 0; i <= 6; i++) {
            const val = xMin + (i / 6) * (xMax - xMin);
            const { px } = dataToPixel(val, yMin, width, height);
            ctx.fillText(val.toFixed(0), px, PADDING + plotH + 8);
        }

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        // Y-Axis labels
        for (let i = 0; i <= 6; i++) {
            const val = yMin + (i / 6) * (yMax - yMin);
            const { py } = dataToPixel(xMin, val, width, height);
            ctx.fillText(val.toFixed(0), PADDING - 8, py);
        }

        // draw actual data points
        for (const p of points) {
            const { px, py } = dataToPixel(p.x, p.y, width, height);
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fillStyle = p.label === "A" ? "#2563eb" : "#10b981";
            ctx.fill();
            // border
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
        }

        // legend
        ctx.font = "12px Inter";
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(PADDING + 10, PADDING + plotH + 30, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme === "dark" ? "#cbd5e1" : "#64748b";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("Class A Points", PADDING + 22, PADDING + plotH + 30);

        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(PADDING + 150, PADDING + plotH + 30, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme === "dark" ? "#cbd5e1" : "#64748b";
        ctx.fillText("Class B Points", PADDING + 162, PADDING + plotH + 30);

        // For SVM, draw decision boundary line
        if (algorithm === "SVM") {
            ctx.strokeStyle = "#0ea5e9";
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (Math.abs(svmW2) > 1e-6) {
                const y1_data = -(svmW1 * xMin + svmB) / svmW2;
                const y2_data = -(svmW1 * xMax + svmB) / svmW2;
                const { px: px1, py: py1 } = dataToPixel(xMin, y1_data, width, height);
                const { px: px2, py: py2 } = dataToPixel(xMax, y2_data, width, height);
                ctx.moveTo(px1, py1);
                ctx.lineTo(px2, py2);
                ctx.stroke();
            } else {
                if (Math.abs(svmW1) > 1e-6) {
                    const x_data = -svmB / svmW1;
                    const { px, py: py1 } = dataToPixel(x_data, yMin, width, height);
                    const { py: py2 } = dataToPixel(x_data, yMax, width, height);
                    ctx.moveTo(px, py1);
                    ctx.lineTo(px, py2);
                    ctx.stroke();
                }
            }
        }

        // For Logistic, draw contour
        if (algorithm === "Logistic") {
            ctx.strokeStyle = "#0ea5e9";
            ctx.lineWidth = 1.5;
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    const gx = xMin + (c / (GRID_COLS - 1)) * (xMax - xMin);
                    const gy = yMax - (r / (GRID_ROWS - 1)) * (yMax - yMin);
                    const features = [1, gx, gy, gx * gx, gx * gy, gy * gy];
                    let z = 0;
                    for (let i = 0; i < logW.length; i++) z += (logW[i] || 0) * features[i];
                    const p = sigmoid(z);
                    if (Math.abs(p - 0.5) < 0.06) {
                        const px = PADDING + (c / (GRID_COLS - 1)) * plotW;
                        const py = PADDING + (r / (GRID_ROWS - 1)) * plotH;
                        ctx.beginPath();
                        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                        ctx.fillStyle = "#0ea5e9";
                        ctx.fill();
                    }
                }
            }
        }
    }, [points, classifyGrid, algorithm, theme, kValue, svmW1, svmW2, svmB, logW, domain]);

    // Canvas click handler: add point
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const width = (e.target as HTMLCanvasElement).clientWidth;
        const height = (e.target as HTMLCanvasElement).clientHeight;

        const xPx = e.clientX - rect.left;
        const yPx = e.clientY - rect.top;

        // convert px to data coords
        const { x, y } = pixelToData(xPx, yPx, width, height);

        // Only add point if click is inside the plotting area
        if (xPx > PADDING && xPx < width - PADDING && yPx > PADDING && yPx < height - PADDING) {
            if (isFinite(x) && isFinite(y)) {
                setPoints((p) => [
                    ...p,
                    { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), label: formLabel },
                ]);
            }
        }
    };

    // Add from form
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

    // Animate boundary
    const animateBoundary = () => {
        const duration = 700;
        const steps = 28;
        let step = 0;

        if (algorithm === "KNN") {
            const start = kValue;
            const target = Math.max(1, Math.min(9, Math.round(points.length / 2) || 3));
            const timer = setInterval(() => {
                step++;
                const t = step / steps;
                const val = Math.round(start + (target - start) * t);
                setKValue(val);
                if (step >= steps) clearInterval(timer);
            }, duration / steps);
        } else if (algorithm === "SVM") {
            const aPts = points.filter((p) => p.label === "A");
            const bPts = points.filter((p) => p.label === "B");
            let targetW1 = 1;
            let targetW2 = -1;
            let targetB = 0;
            if (aPts.length && bPts.length) {
                const aCx = aPts.reduce((s, p) => s + p.x, 0) / aPts.length;
                const aCy = aPts.reduce((s, p) => s + p.y, 0) / aPts.length;
                const bCx = bPts.reduce((s, p) => s + p.x, 0) / bPts.length;
                const bCy = bPts.reduce((s, p) => s + p.y, 0) / bPts.length;
                targetW1 = aCx - bCx;
                targetW2 = aCy - bCy;
                targetB = -((targetW1 * (aCx + bCx) / 2) + (targetW2 * (aCy + bCy) / 2));
            }
            const sW1 = svmW1;
            const sW2 = svmW2;
            const sB = svmB;

            const timer = setInterval(() => {
                step++;
                const t = step / steps;
                setSvmW1(sW1 + (targetW1 - sW1) * t);
                setSvmW2(sW2 + (targetW2 - sW2) * t);
                setSvmB(sB + (targetB - sB) * t);
                if (step >= steps) clearInterval(timer);
            }, duration / steps);
        } else {
            const aPts = points.filter((p) => p.label === "A");
            const bPts = points.filter((p) => p.label === "B");
            const startW = [...logW];
            const targetW = [...startW];
            if (aPts.length && bPts.length) {
                const aCx = aPts.reduce((s, p) => s + p.x, 0) / aPts.length;
                const aCy = aPts.reduce((s, p) => s + p.y, 0) / aPts.length;
                const bCx = bPts.reduce((s, p) => s + p.x, 0) / bPts.length;
                const bCy = bPts.reduce((s, p) => s + p.y, 0) / bPts.length;

                targetW[0] = Math.random() * -2; // bias
                targetW[1] = aCx - bCx;
                targetW[2] = aCy - bCy;
                targetW[3] = 0.3 * (aCx - bCx);
                targetW[4] = 0.1 * (aCx - bCx + aCy - bCy);
                targetW[5] = 0.3 * (aCy - bCy);
            } else {
                for (let i = 0; i < targetW.length; i++) targetW[i] = startW[i];
            }

            const timer = setInterval(() => {
                step++;
                const t = step / steps;
                setLogW((s) => s.map((sv, i) => sv + (targetW[i] - sv) * t));
                if (step >= steps) clearInterval(timer);
            }, duration / steps);
        }
    };

    // helper to update a specific logistic weight
    const setLogWAt = (i: number, value: number) => {
        setLogW((prev) => prev.map((v, idx) => (idx === i ? value : v)));
    };

    // =========================================================================
    // --- THIS IS THE START OF THE LAYOUT (JSX) ---
    // =========================================================================
    return (
        <div className="p-6 max-w-[1200px] mx-auto">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Decision Boundary Visualizer</h1>
                <nav className="flex gap-4 text-sm">
                    <span className="text-gray-500">ML Visualizer</span>
                </nav>
            </header>

            {/* --- TOP ROW: PARAMS + CHART --- */}
            <div className="grid grid-cols-12 gap-6">
                {/* === START: LEFT COLUMN (PARAMS) === */}
                <div className="col-span-12 md:col-span-4 bg-white border rounded-lg p-5 shadow-sm">
                    <h2 className="font-medium mb-3">Algorithm Parameters</h2>

                    <label className="text-sm block mb-2">Algorithm:</label>
                    <select
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value as any)}
                        className="w-full mb-4 p-2 border rounded"
                    >
                        <option value="Logistic">Logistic Regression (Polynomial)</option>
                        <option value="SVM">Support Vector Machine (Linear)</option>
                        <option value="KNN">K-Nearest Neighbors</option>
                    </select>

                    {algorithm === "KNN" && (
                        <>
                            <label className="text-sm">K value: {kValue}</label>
                            <input
                                type="range"
                                min={1}
                                max={15}
                                value={kValue}
                                onChange={(e) => setKValue(Number(e.target.value))}
                                className="w-full mt-2"
                            />
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
                                className="w-full mt-2"
                            />
                            <label className="text-sm mt-3">Weight w2: {svmW2.toFixed(2)}</label>
                            <input
                                type="range"
                                min={-5}
                                max={5}
                                step={0.1}
                                value={svmW2}
                                onChange={(e) => setSvmW2(Number(e.target.value))}
                                className="w-full mt-2"
                            />
                            <label className="text-sm mt-3">Bias: {svmB.toFixed(2)}</label>
                            <input
                                type="range"
                                min={-10}
                                max={10}
                                step={0.1}
                                value={svmB}
                                onChange={(e) => setSvmB(Number(e.target.value))}
                                className="w-full mt-2 mb-4"
                            />
                        </>
                    )}

                    {algorithm === "Logistic" && (
                        <>
                            <label className="text-sm">Polynomial Degree: {polyDegree}</label>
                            <input
                                type="range"
                                min={1}
                                max={2}
                                step={1}
                                value={polyDegree}
                                onChange={(e) => setPolyDegree(Number(e.target.value))}
                                className="w-full mt-2 mb-3"
                                disabled // only degree 2 is implemented in this file
                            />
                            <div className="text-sm text-gray-500 mb-2">Weights (bias, x, y, x², xy, y²)</div>
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
                        className="mt-5 w-full bg-blue-600 text-white py-2 rounded shadow"
                    >
                        Animate Boundary
                    </button>
                </div>
                {/* === END: LEFT COLUMN (PARAMS) === */}


                {/* === START: RIGHT COLUMN (CHART) === */}
                <div className="col-span-12 md:col-span-8 bg-white border rounded-lg p-5 shadow-sm">
                    <canvas
                        ref={canvasRef}
                        onClick={handleCanvasClick}
                        className="w-full h-[400px] cursor-crosshair"
                    />
                </div>
                {/* === END: RIGHT COLUMN (CHART) === */}
            </div>


            {/* ====================================================================== */}
            {/* --- THIS IS THE NEW SINGLE-COLUMN LAYOUT FOR ALL CONTENT BELOW --- */}
            {/* ====================================================================== */}
            <div className="mt-6 space-y-6">

                {/* --- "HOW IT WORKS" (CONTENT UPDATED) --- */}
                <div className="bg-white border rounded-lg p-5 shadow-sm">
                    <h3 className="font-semibold mb-3">How Decision Boundaries Work</h3>
                    <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                        <li>This visualizer shows how different algorithms partition the 2D feature space.</li>
                        <li>Each algorithm learns from the data points to create a classification model.</li>
                        <li>The background color (blue/green) represents the "decision region" for that class.</li>
                        <li>The decision boundary is the line or curve where the classification changes from Class A to Class B.</li>
                    </ol>
                </div>

                {/* --- "DATA POINTS" (NOW INCLUDES ADD POINT CONTROLS) --- */}
                <div className="bg-white border rounded-lg p-5 shadow-sm">
                    <h3 className="font-semibold mb-3">Data Points</h3>

                    {/* --- ADD POINT CONTROLS (MOVED HERE) --- */}
                    <div className="flex flex-wrap gap-3 items-center mb-4 pb-4 border-b">
                        <input
                            placeholder="X value"
                            value={formX}
                            onChange={(e) => setFormX(e.target.value)}
                            className="p-2 border rounded w-full md:w-40"
                        />
                        <input
                            placeholder="Y value"
                            value={formY}
                            onChange={(e) => setFormY(e.target.value)}
                            className="p-2 border rounded w-full md:w-40"
                        />
                        <select
                            className="p-2 border rounded"
                            value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value as Label)}
                        >
                            <option value="A">Class A</option>
                            <option value="B">Class B</option>
                        </select>

                        <button
                            onClick={addFromForm}
                            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Add Point
                        </button>
                        <button
                            onClick={clearData}
                            className="ml-2 bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Clear Data
                        </button>
                    </div>

                    {/* --- DATA TABLE --- */}
                    <div className="overflow-x-auto max-h-60 border rounded">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-gray-50">
                                <tr className="text-sm text-gray-600">
                                    <th className="py-2 px-3">X</th>
                                    <th className="py-2 px-3">Y</th>
                                    <th className="py-2 px-3">Class</th>
                                </tr>
                            </thead>
                            <tbody>
                                {points.map((p, i) => (
                                    <tr key={i} className="odd:bg-gray-50 border-t">
                                        <td className="py-2 px-3">{p.x}</td>
                                        <td className="py-2 px-3">{p.y}</td>
                                        <td className="py-2 px-3">{p.label}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- "ALGORITHMS EXPLAINED" (CONTENT UPDATED) --- */}
                <div className="bg-white border rounded-lg p-5 shadow-sm">
                    <h3 className="font-semibold mb-3">Classification Algorithms Explained</h3>
                    <div className="prose max-w-none text-sm text-gray-700 space-y-6">

                        {/* --- KNN EXPLANATION --- */}
                        <div>
                            <h4 className="font-semibold">K-Nearest Neighbors (KNN)</h4>
                            <p>
                                KNN is a non-parametric algorithm that classifies new data points based on the majority class of their 'k' nearest neighbors in the training data.
                            </p>

                            <h5 className="font-medium mt-2">Distance Calculation</h5>
                            <p>It typically uses Euclidean distance to find the 'nearest' points.</p>
                            <FormulaBox>
                                {`Distance = sqrt( (x₂ - x₁)² + (y₂ - y₁)² )`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Neighborhood Selection</h5>
                            <p>The algorithm identifies the 'k' data points from the training set that are closest to the new point.</p>

                            <h5 className="font-medium mt-2">Majority Voting</h5>
                            <p>The new point is assigned to the class that is most common among its 'k' nearest neighbors.</p>

                            <h5 className="font-medium mt-2">Decision Boundary</h5>
                            <p>The boundary in KNN is created by the points where the majority vote changes. It's often complex and irregular, adapting to the local data distribution.</p>
                        </div>

                        {/* --- SVM EXPLANATION --- */}
                        <div>
                            <h4 className="font-semibold">Support Vector Machine (Linear)</h4>
                            <p>
                                A linear SVM tries to find the optimal "hyperplane" (a line in 2D) that best separates the two classes with the maximum possible margin.
                            </p>

                            <h5 className="font-medium mt-2">Linear Decision Function</h5>
                            <p>The function for the line is defined by weights (w) and a bias (b).</p>
                            <FormulaBox>
                                {`f(x) = w₁x₁ + w₂x₂ + b = wᵀx + b`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Margin / Gutter</h5>
                            <p>The SVM aims to maximize the distance between the decision line and the closest points from either class (the "support vectors"). These gutters are defined by:</p>
                            <FormulaBox>
                                {`wᵀx + b = 1  (for Class A support vectors)
wᵀx + b = -1 (for Class B support vectors)`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Class Prediction</h5>
                            <p>A new point is classified based on which side of the line it falls on.</p>
                            <FormulaBox>
                                {`IF f(x) ≥ 0, classify as Class A
IF f(x) < 0, classify as Class B`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Decision Boundary Equation</h5>
                            <p>The boundary itself is the line where the decision function is exactly zero.</p>
                            <FormulaBox>
                                {`f(x) = w₁x₁ + w₂x₂ + b = 0`}
                            </FormulaBox>
                        </div>

                        {/* --- LOGISTIC REGRESSION EXPLANATION (BUG FIXED) --- */}
                        <div>
                            <h4 className="font-semibold">Logistic Regression (Polynomial)</h4>
                            <p>
                                Logistic Regression models the probability that a point belongs to a class. By using polynomial features, it can create non-linear decision boundaries.
                            </p>

                            <h5 className="font-medium mt-2">Feature Transformation</h5>
                            <p>We expand our features (x, y) into a higher-dimensional space. For degree 2:</p>
                            <FormulaBox>
                                {`φ(x) = [1, x₁, x₂, x₁², x₁x₂, x₂²]`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Linear Combination (z)</h5>
                            <p>A linear combination is computed in this new feature space using weights (w).</p>
                            <FormulaBox>
                                {`z = w₀ + w₁x₁ + w₂x₂ + w₃x₁² + w₄x₁x₂ + w₅x₂²`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Sigmoid Transformation</h5>
                            <p>The 'z' value is passed through the sigmoid function to map it to a probability between 0 and 1.</p>
                            {/* --- THIS IS THE FIXED LINE (from your error) --- */}
                            <FormulaBox>
                                {`p = σ(z) = 1 / (1 + e⁻ᶻ)`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Decision Rule</h5>
                            <p>We classify based on a probability threshold, typically 0.5.</p>
                            <FormulaBox>
                                {`IF p(z) ≥ 0.5, classify as Class A
IF p(z) < 0.5, classify as Class B`}
                            </FormulaBox>

                            <h5 className="font-medium mt-2">Boundary Characteristics</h5>
                            <p>The boundary occurs where p(z) = 0.5, which happens when z = 0. This creates a quadratic shape (like a circle, ellipse, or parabola).</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* === END: SINGLE-COLUMN LAYOUT === */}

        </div>
    );
}