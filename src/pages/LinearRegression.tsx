// __define-ocg__
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from "../context/ThemeContext";
import {
    FaPlay,
    FaPause,
    FaTrash,
    FaPlus
} from "react-icons/fa";

/**
 * Single-file Linear Regression visualizer (TypeScript + React).
 * - Animated gradient-descent fitting (visual animation like ML Visualiser)
 * - Canvas drawing: axes, grid, points, residuals, animated line
 * - Add / Clear / Animate / Remove points
 *
 * Drop into src/components/LinearRegression.tsx and render.
 */

/* Small helpers you asked to include earlier (no-op usage, kept for compatibility) */
const varOcg = "__varOcg_placeholder__";
const varFiltersCg = "__varFiltersCg_placeholder__";

type DataPoint = { x: number; y: number };

const CANVAS_W = 640;
const CANVAS_H = 360;
const PAD = 48; // margin for axes labels and padding

export default function LinearRegression(): TSX.Element {
    const { theme } = useTheme();

    // default points to match screenshot (1..5)
    const [dataPoints, setDataPoints] = useState<DataPoint[]>([
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 7 },
        { x: 5, y: 8 }
    ]);

    // input fields
    const [inputX, setInputX] = useState<string>('');
    const [inputY, setInputY] = useState<string>('');

    // animation & control state
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState<'fast' | 'slow'>('fast');

    // refs for canvas and animation
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    // data bounds (we will compute dynamic bounds from points)
    const boundsRef = useRef({ xmin: 0, xmax: 8, ymin: 0, ymax: 8 });

    // current animated parameters (m,b) used for drawing the line
    const currentRef = useRef({ m: 0, b: 0 });

    // target closed-form least squares solution (for reference and SSR)
    const targetRef = useRef({ m: 0, b: 0, ssr: 0 });

    // animation config derived from speed
    const getAnimationConfig = () => {
        if (speed === 'fast') {
            return { lr: 0.05, stepsPerFrame: 6 }; // larger learning rate, more steps
        } else {
            return { lr: 0.01, stepsPerFrame: 2 };
        }
    };

    // compute bounds of the data (and add padding)
    const computeBounds = (pts: DataPoint[]) => {
        if (!pts || pts.length === 0) return { xmin: 0, xmax: 8, ymin: 0, ymax: 8 };
        let xs = pts.map(p => p.x);
        let ys = pts.map(p => p.y);
        let xmin = Math.min(...xs);
        let xmax = Math.max(...xs);
        let ymin = Math.min(...ys);
        let ymax = Math.max(...ys);

        // add padding
        const xpad = Math.max(1, (xmax - xmin) * 0.25);
        const ypad = Math.max(1, (ymax - ymin) * 0.25);
        xmin -= xpad;
        xmax += xpad;
        ymin -= ypad;
        ymax += ypad;

        // ensure non-zero range
        if (Math.abs(xmax - xmin) < 1e-6) { xmin -= 1; xmax += 1; }
        if (Math.abs(ymax - ymin) < 1e-6) { ymin -= 1; ymax += 1; }

        // clamp to reasonable grid (we like 0..8 in screenshot if possible)
        return { xmin, xmax, ymin, ymax };
    };

    // Map data -> canvas coordinates
    const toCanvas = (x: number, y: number) => {
        const { xmin, xmax, ymin, ymax } = boundsRef.current;
        const w = CANVAS_W - PAD * 2;
        const h = CANVAS_H - PAD * 2;
        const cx = PAD + ((x - xmin) / (xmax - xmin)) * w;
        const cy = PAD + (1 - (y - ymin) / (ymax - ymin)) * h;
        return { cx, cy };
    };
    // Map canvas pixel -> data coords
    const toData = (cx: number, cy: number) => {
        const { xmin, xmax, ymin, ymax } = boundsRef.current;
        const w = CANVAS_W - PAD * 2;
        const h = CANVAS_H - PAD * 2;
        const x = xmin + ((cx - PAD) / w) * (xmax - xmin);
        const y = ymin + (1 - (cy - PAD) / h) * (ymax - ymin);
        return { x, y };
    };

    // Closed-form least squares (target solution)
    const computeClosedForm = (pts: DataPoint[]) => {
        const n = pts.length;
        if (n === 0) return { m: 0, b: 0, ssr: 0 };

        let sumX = 0, sumY = 0;
        for (const p of pts) { sumX += p.x; sumY += p.y; }
        const meanX = sumX / n;
        const meanY = sumY / n;

        let num = 0, den = 0;
        for (const p of pts) {
            const dx = p.x - meanX;
            num += dx * (p.y - meanY);
            den += dx * dx;
        }
        const m = den === 0 ? 0 : num / den;
        const b = meanY - m * meanX;

        // SSR (sum of squared residuals)
        let ssr = 0;
        for (const p of pts) {
            const pred = m * p.x + b;
            const r = p.y - pred;
            ssr += r * r;
        }

        return { m, b, ssr };
    };

    // Gradient descent step: update currentRef.m and currentRef.b
    const gradientStep = (pts: DataPoint[], lr: number) => {
        if (!pts || pts.length === 0) return;
        const n = pts.length;
        let dm = 0, db = 0;
        for (const p of pts) {
            const pred = currentRef.current.m * p.x + currentRef.current.b;
            const err = pred - p.y; // derivative of squared error w.r.t. pred
            dm += (2 / n) * err * p.x; // d/dm of average squared error
            db += (2 / n) * err;
        }
        // gradient descent: subtract gradient * lr
        currentRef.current.m -= lr * dm;
        currentRef.current.b -= lr * db;
    };

    // compute SSR for *current* line (for display during animation)
    const computeSSRCurrent = (pts: DataPoint[]) => {
        let ssr = 0;
        for (const p of pts) {
            const pred = currentRef.current.m * p.x + currentRef.current.b;
            const r = p.y - pred;
            ssr += r * r;
        }
        return ssr;
    };

    // Draw everything on canvas
    const draw = () => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d');
        if (!ctx) return;

        // handle devicePixelRatio for crispness
        const dpr = window.devicePixelRatio || 1;
        cvs.width = CANVAS_W * dpr;
        cvs.height = CANVAS_H * dpr;
        cvs.style.width = `${CANVAS_W}px`;
        cvs.style.height = `${CANVAS_H}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // clear
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // choose colors based on theme
        const bg = theme === 'dark' ? '#0b1220' : '#ffffff';
        const axis = theme === 'dark' ? '#2b3340' : '#e6edf3';
        const text = theme === 'dark' ? '#e6eef8' : '#0f172a';

        // background
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // grid / axes box
        ctx.strokeStyle = axis;
        ctx.lineWidth = 1;
        ctx.strokeRect(PAD, PAD, CANVAS_W - PAD * 2, CANVAS_H - PAD * 2);

        // ticks and grid lines
        const { xmin, xmax, ymin, ymax } = boundsRef.current;
        const xTicks = 8;
        const yTicks = 6;
        ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        // vertical grid lines
        for (let i = 0; i <= xTicks; i++) {
            const t = i / xTicks;
            const x = xmin + t * (xmax - xmin);
            const { cx } = toCanvas(x, ymin);
            ctx.beginPath();
            ctx.moveTo(cx, PAD);
            ctx.lineTo(cx, CANVAS_H - PAD);
            ctx.stroke();
        }
        // horizontal grid lines
        for (let i = 0; i <= yTicks; i++) {
            const t = i / yTicks;
            const y = ymin + t * (ymax - ymin);
            const { cy } = toCanvas(xmin, y);
            ctx.beginPath();
            ctx.moveTo(PAD, cy);
            ctx.lineTo(CANVAS_W - PAD, cy);
            ctx.stroke();
        }

        // axes labels (min/max)
        ctx.fillStyle = text;
        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(xmin.toFixed(2), PAD + 6, CANVAS_H - PAD + 14);
        ctx.textAlign = 'right';
        ctx.fillText(xmax.toFixed(2), CANVAS_W - PAD - 6, CANVAS_H - PAD + 14);
        ctx.textAlign = 'left';
        ctx.fillText(ymax.toFixed(2), 6, PAD + 8);
        ctx.fillText(ymin.toFixed(2), 6, CANVAS_H - PAD - 6);

        // draw the animated regression line (currentRef)
        const curM = currentRef.current.m;
        const curB = currentRef.current.b;
        // line endpoints at xmin,xmax
        const leftY = curM * xmin + curB;
        const rightY = curM * xmax + curB;
        const leftPt = toCanvas(xmin, leftY);
        const rightPt = toCanvas(xmax, rightY);
        ctx.beginPath();
        ctx.moveTo(leftPt.cx, leftPt.cy);
        ctx.lineTo(rightPt.cx, rightPt.cy);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2563eb'; // blue
        ctx.stroke();

        // draw dashed predicted (lighter)
        ctx.beginPath();
        ctx.setLineDash([6, 5]);
        ctx.moveTo(leftPt.cx, leftPt.cy);
        ctx.lineTo(rightPt.cx, rightPt.cy);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = 'rgba(37,99,235,0.35)';
        ctx.stroke();
        ctx.setLineDash([]);

        // draw residual dashed green lines & points
        for (let i = 0; i < dataPoints.length; i++) {
            const p = dataPoints[i];
            const predicted = curM * p.x + curB;
            const pCanvas = toCanvas(p.x, p.y);
            const predCanvas = toCanvas(p.x, predicted);

            // residual dashed
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.moveTo(pCanvas.cx, pCanvas.cy);
            ctx.lineTo(predCanvas.cx, predCanvas.cy);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#10b981'; // green
            ctx.stroke();
            ctx.setLineDash([]);

            // point
            ctx.beginPath();
            ctx.fillStyle = '#ef4444'; // red
            ctx.arc(pCanvas.cx, pCanvas.cy, 5, 0, Math.PI * 2);
            ctx.fill();

            // small stroke
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#111827';
            ctx.stroke();
        }
    };

    // draw whenever points or currentRef change
    useEffect(() => {
        // update bounds
        boundsRef.current = computeBounds(dataPoints);

        // ensure target (closed-form) is kept up to date
        const closed = computeClosedForm(dataPoints);
        targetRef.current = closed;

        // if animation not running, also set current to closed-form to display final line
        if (!isAnimating) {
            currentRef.current.m = closed.m;
            currentRef.current.b = closed.b;
        }

        draw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataPoints, theme]);

    // compute SSR (closed form) for display in card
    const closed = computeClosedForm(dataPoints);
    const closedM = closed.m;
    const closedB = closed.b;
    const closedSSR = closed.ssr;

    // animate gradient descent to minimize SSR (visual)
    const animateGradientDescent = () => {
        if (isAnimating) return;
        // initialize current to some starting line (we'll start at currentRef or a neutral)
        // keep running until close to closed-form or max iterations
        setIsAnimating(true);
        const pts = dataPoints.slice();
        // If no data: just stop
        if (pts.length === 0) {
            setIsAnimating(false);
            return;
        }

        // Start from currentRef (which might be closed-form or zero)
        // We'll perform gradient descent in RAF loop
        const { lr, stepsPerFrame } = getAnimationConfig();
        const maxIters = 4000;
        let iter = 0;

        const loop = (time: number) => {
            // per animation frame, do multiple gradient steps to speed up for 'fast'
            for (let s = 0; s < stepsPerFrame; s++) {
                gradientStep(pts, lr);
                iter++;
                // optional stopping: if close enough to closed form
                const errDiff = Math.abs(currentRef.current.m - closedM) + Math.abs(currentRef.current.b - closedB);
                if (errDiff < 1e-4 || iter > maxIters) {
                    // snap to closed form
                    currentRef.current.m = closedM;
                    currentRef.current.b = closedB;
                    draw();
                    setIsAnimating(false);
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = null;
                    }
                    return;
                }
            }
            draw();
            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
    };

    // cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // canvas click handler to add a point at clicked location (mapped to data coords)
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const data = toData(cx, cy);
        // add new point
        setDataPoints(prev => {
            const next = [...prev, { x: parseFloat(data.x.toFixed(3)), y: parseFloat(data.y.toFixed(3)) }];
            // update boundsRef immediately
            boundsRef.current = computeBounds(next);
            return next;
        });
    };

    // Add point from inputs
    const addPoint = () => {
        const x = parseFloat(inputX);
        const y = parseFloat(inputY);
        if (isNaN(x) || isNaN(y)) return;
        setDataPoints(prev => {
            const next = [...prev, { x, y }];
            boundsRef.current = computeBounds(next);
            return next;
        });
        setInputX('');
        setInputY('');
    };

    // Remove a point by index
    const removePoint = (idx: number) => {
        setDataPoints(prev => {
            const next = prev.filter((_, i) => i !== idx);
            boundsRef.current = computeBounds(next);
            return next;
        });
    };

    // clear all data points
    const clearData = () => {
        setDataPoints([]);
        currentRef.current = { m: 0, b: 0 };
        targetRef.current = { m: 0, b: 0, ssr: 0 };
        draw();
    };

    // quick helper to format numbers
    const fmt = (v: number) => v.toFixed(4);

    // manual pause/resume of animation
    const toggleAnimation = () => {
        if (isAnimating) {
            // stop
            setIsAnimating(false);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            // leave currentRef as-is
        } else {
            // start
            animateGradientDescent();
        }
    };

    // compute residuals (absolute) for display using CLOSED-FORM best line (like screenshot)
    const residualsClosed = dataPoints.map((p) => {
        const pred = closedM * p.x + closedB;
        const resid = Math.abs(p.y - pred);
        return Math.round(resid * 1000) / 1000;
    });

    // render UI (keeps your structure)
    return (
        <div className={`min-h-screen pt-24 pb-10 transition-all duration-500 ${theme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-white text-black"
            }`}>
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-violet-400 mb-4">Animated Linear Regression</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Regression Equation */}
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <h2 className="text-xl font-semibold text-violet-300 mb-4">Regression Equation</h2>
                            <div className="text-center mb-4">
                                <div className="text-2xl font-mono text-violet-400">
                                    {/* Show current animated line */}
                                    y = {fmt(currentRef.current.m)} × x + {fmt(currentRef.current.b)}
                                </div>
                            </div>
                            <div className={`text-center p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="font-semibold">Total Error (Sum of Squared Residuals): {fmt(closedSSR)}</div>
                            </div>
                        </div>

                        {/* Graph */}
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <canvas
                                ref={canvasRef}
                                className="w-full h-80 bg-white rounded cursor-crosshair"
                                onClick={handleCanvasClick}
                                style={{ display: 'block' }}
                            />
                        </div>

                        {/* Residuals list */}
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Residuals</h3>
                            <div className="space-y-2 text-sm">
                                <div className="text-blue-400"><strong>Regression Line:</strong> {fmt(closedM * 1 + closedB)}</div>
                                {residualsClosed.map((r, i) => (
                                    <div key={i} className="text-green-400"><strong>Residual {i}:</strong> {r}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column - controls */}
                    <div className="space-y-6">
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">X value</label>
                                    <input
                                        type="number"
                                        value={inputX}
                                        onChange={(e) => setInputX(e.target.value)}
                                        min="0"
                                        step="0.1"
                                        className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                        placeholder="Enter X"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-400">Y value</label>
                                    <input
                                        type="number"
                                        value={inputY}
                                        onChange={(e) => setInputY(e.target.value)}
                                        min="0"
                                        step="0.1"
                                        className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'}`}
                                        placeholder="Enter Y"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={addPoint}
                                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                                    >
                                        <FaPlus className="text-sm" /> Add Point
                                    </button>
                                    <button
                                        onClick={clearData}
                                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
                                    >
                                        <FaTrash className="text-sm" /> Clear Data
                                    </button>
                                </div>
                                <button
                                    onClick={toggleAnimation}
                                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition"
                                >
                                    {isAnimating ? <FaPause className="text-sm" /> : <FaPlay className="text-sm" />}
                                    {isAnimating ? 'Animating...' : 'Animate BFL'}
                                </button>
                            </div>
                        </div>

                        {/* animation speed */}
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Animation Speed:</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSpeed('fast')}
                                    className={`flex-1 py-2 rounded font-medium transition ${speed === 'fast' ? 'bg-green-600 text-white' : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                >
                                    Fast
                                </button>
                                <button
                                    onClick={() => setSpeed('slow')}
                                    className={`flex-1 py-2 rounded font-medium transition ${speed === 'slow' ? 'bg-green-600 text-white' : (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                                >
                                    Slow
                                </button>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">How the Best Fit Line Works</h3>
                            <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
                                <li>Calculate mean of X and Y - Find the "center" of the data.</li>
                                <li>Calculate slope - Using the formula: slope = ∑(x-x̄)(y-ȳ) / ∑(x-x̄)²</li>
                                <li>Calculate y-intercept - Using the formula: intercept = ȳ - slope × x̄</li>
                                <li>Minimize residuals - The green dotted lines show the errors (distances) between actual and predicted values.</li>
                                <li>Sum of squared errors - The optimal line minimizes the sum of these squared errors.</li>
                            </ol>
                        </div>

                        {/* Data points table */}
                        <div className={`p-6 rounded-lg border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
                            <h3 className="text-lg font-semibold text-gray-300 mb-4">Data Points</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className={`border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                                            <th className="text-left py-2 font-semibold text-gray-400">X</th>
                                            <th className="text-left py-2 font-semibold text-gray-400">Y</th>
                                            <th className="text-left py-2 font-semibold text-gray-400">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataPoints.map((pt, i) => (
                                            <tr key={i} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                                <td className="py-2 text-gray-300">{pt.x}</td>
                                                <td className="py-2 text-gray-300">{pt.y}</td>
                                                <td className="py-2">
                                                    <button onClick={() => removePoint(i)} className="text-red-500 hover:text-red-700 transition-colors">
                                                        <FaTrash className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {dataPoints.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">No data points</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
