// src/pages/LinearRegression.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Canvas Linear Regression Visualiser
 * - React + TypeScript + Tailwind
 * - Click canvas to add points
 * - Sliders for slope & intercept (manual)
 * - Animate button: animates current (m,b) -> computed best-fit (m*, b*)
 * - Residual dashed lines update live during animation
 * - Hover tooltip shows x,y,residual
 */

type Point = { x: number; y: number };

const PADDING = 48; // canvas padding for axes area
const POINT_RADIUS = 5;

function calcRegression(points: Point[]) {
    const n = points.length;
    if (n === 0) return { m: 0, b: 0, error: 0 };
    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
    const denom = n * sumX2 - sumX * sumX;
    const m = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - m * sumX) / n;
    const error = points.reduce((e, p) => {
        const pred = m * p.x + b;
        return e + (p.y - pred) ** 2;
    }, 0);
    return { m, b, error };
}

export default function LinearRegression() {
    const [points, setPoints] = useState<Point[]>([
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 7 },
        { x: 5, y: 8 },
    ]);

    const { m: targetM, b: targetB, error: totalError } = calcRegression(points);

    // current displayed line (animated / controlled)
    const [currentM, setCurrentM] = useState<number>(targetM);
    const [currentB, setCurrentB] = useState<number>(targetB);

    // manual controls override animation
    const [manualM, setManualM] = useState<number | null>(null);
    const [manualB, setManualB] = useState<number | null>(null);

    const [isAnimating, setIsAnimating] = useState(false);
    const [animSpeed, setAnimSpeed] = useState(40); // 1..100
    const [showResiduals, setShowResiduals] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);

    // hover tooltip
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);

    // autoscale domain
    const getDomain = useCallback(() => {
        if (points.length === 0) return { xmin: 0, xmax: 10, ymin: 0, ymax: 10 };
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        let xmin = Math.min(...xs);
        let xmax = Math.max(...xs);
        let ymin = Math.min(...ys);
        let ymax = Math.max(...ys);
        // pad
        const xpad = Math.max(1, (xmax - xmin) * 0.15);
        const ypad = Math.max(1, (ymax - ymin) * 0.15);
        xmin = xmin - xpad;
        xmax = xmax + xpad;
        ymin = ymin - ypad;
        ymax = ymax + ypad;
        // if flat, expand
        if (Math.abs(xmax - xmin) < 1e-6) { xmax = xmin + 5; }
        if (Math.abs(ymax - ymin) < 1e-6) { ymax = ymin + 5; }
        return { xmin, xmax, ymin, ymax };
    }, [points]);

    // mapping functions between data and pixels
    function dataToPixel(x: number, y: number, width: number, height: number) {
        const { xmin, xmax, ymin, ymax } = getDomain();
        const px = PADDING + ((x - xmin) / (xmax - xmin)) * (width - 2 * PADDING);
        const py = height - PADDING - ((y - ymin) / (ymax - ymin)) * (height - 2 * PADDING);
        return { px, py };
    }
    function pixelToData(px: number, py: number, width: number, height: number) {
        const { xmin, xmax, ymin, ymax } = getDomain();
        const x = xmin + ((px - PADDING) / (width - 2 * PADDING)) * (xmax - xmin);
        const y = ymin + ((height - PADDING - py) / (height - 2 * PADDING)) * (ymax - ymin);
        return { x, y };
    }

    // draw function
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const DPR = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (canvas.width !== Math.floor(width * DPR) || canvas.height !== Math.floor(height * DPR)) {
            canvas.width = Math.floor(width * DPR);
            canvas.height = Math.floor(height * DPR);
        }
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // background
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, width, height);

        // grid
        ctx.strokeStyle = "#e6e6e6";
        ctx.lineWidth = 1;
        const xSteps = 8;
        const ySteps = 8;
        for (let i = 0; i <= xSteps; i++) {
            const x = PADDING + (i / xSteps) * (width - 2 * PADDING);
            ctx.beginPath();
            ctx.moveTo(x, PADDING);
            ctx.lineTo(x, height - PADDING);
            ctx.stroke();
        }
        for (let j = 0; j <= ySteps; j++) {
            const y = PADDING + (j / ySteps) * (height - 2 * PADDING);
            ctx.beginPath();
            ctx.moveTo(PADDING, y);
            ctx.lineTo(width - PADDING, y);
            ctx.stroke();
        }

        // axes
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        // x axis
        ctx.moveTo(PADDING, height - PADDING);
        ctx.lineTo(width - PADDING, height - PADDING);
        // y axis
        ctx.moveTo(PADDING, PADDING);
        ctx.lineTo(PADDING, height - PADDING);
        ctx.stroke();

        // draw residual dashed lines if enabled
        if (showResiduals) {
            points.forEach((p, i) => {
                const predictedY = currentM * p.x + currentB;
                const { px: px1, py: py1 } = dataToPixel(p.x, p.y, width, height);
                const { px: px2, py: py2 } = dataToPixel(p.x, predictedY, width, height);
                ctx.beginPath();
                ctx.setLineDash([6, 6]);
                ctx.strokeStyle = "green";
                ctx.lineWidth = 1.5;
                ctx.moveTo(px1, py1);
                ctx.lineTo(px2, py2);
                ctx.stroke();
                ctx.setLineDash([]);
            });
        }

        // draw regression line (red) across domain
        {
            const leftData = pixelToData(PADDING, 0, width, height).x;
            const rightData = pixelToData(width - PADDING, 0, width, height).x;
            const yLeft = currentM * leftData + currentB;
            const yRight = currentM * rightData + currentB;
            const { px: lpx, py: lpy } = dataToPixel(leftData, yLeft, width, height);
            const { px: rpx, py: rpy } = dataToPixel(rightData, yRight, width, height);
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2.5;
            ctx.moveTo(lpx, lpy);
            ctx.lineTo(rpx, rpy);
            ctx.stroke();
        }

        // draw points on top
        points.forEach((p, i) => {
            const { px, py } = dataToPixel(p.x, p.y, width, height);
            ctx.beginPath();
            ctx.fillStyle = i === hoverIdx ? "#ff8c00" : "#2563eb"; // hover highlight
            ctx.arc(px, py, POINT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        });

        // labels: equation & total error top-left
        ctx.fillStyle = "#111827";
        ctx.font = "14px sans-serif";
        ctx.fillText(`y = ${currentM.toFixed(4)} x + ${currentB.toFixed(4)}`, PADDING + 2, 20);
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px sans-serif";
        ctx.fillText(`Total SSE: ${totalError.toFixed(4)}`, PADDING + 2, 38);
    }, [points, currentM, currentB, getDomain, hoverIdx, showResiduals, totalError]);

    // initial set current line to computed line
    useEffect(() => {
        if (!manualM && !manualB) {
            setCurrentM(targetM);
            setCurrentB(targetB);
        }
    }, [targetM, targetB, manualM, manualB]);

    // animation: random movement + smooth settle to target
    useEffect(() => {
        if (!isAnimating) return;
        const duration = Math.max(80, (101 - animSpeed) * 8);
        const startTime = performance.now();
        const startM = currentM;
        const startB = currentB;
        const deltaM = targetM - startM;
        const deltaB = targetB - startB;

        const step = (t: number) => {
            const elapsed = t - startTime;
            const norm = Math.min(1, elapsed / duration);
            // ease in-out cubic
            const ease = norm < 0.5 ? 4 * norm * norm * norm : 1 - Math.pow(-2 * norm + 2, 3) / 2;

            // small random jitter effect (left-right, up-down wiggle)
            const randomM = (Math.random() - 0.5) * 0.3; // slope variation
            const randomB = (Math.random() - 0.5) * 0.8; // intercept variation

            // combine formula: smooth movement + noise
            const newM = startM + deltaM * ease + randomM * (1 - ease);
            const newB = startB + deltaB * ease + randomB * (1 - ease);

            setCurrentM(newM);
            setCurrentB(newB);

            if (norm < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                // settle exactly on target
                setCurrentM(targetM);
                setCurrentB(targetB);
                setIsAnimating(false);
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAnimating, animSpeed, targetM, targetB]);

    // redraw on changes
    useEffect(() => {
        draw();
    }, [draw]);

    // canvas events
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = () => canvas.getBoundingClientRect();

        const onMove = (e: MouseEvent) => {
            const r = rect();
            const px = e.clientX - r.left;
            const py = e.clientY - r.top;
            // find nearest point
            let nearest: number | null = null;
            let minD = 9999;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            points.forEach((p, i) => {
                const { px: cx, py: cy } = dataToPixel(p.x, p.y, width, height);
                const d = Math.hypot(cx - px, cy - py);
                if (d < minD && d < 12) {
                    minD = d;
                    nearest = i;
                }
            });
            setHoverIdx(nearest);
            if (nearest !== null) {
                // show tooltip near cursor
                setTooltipPos({ left: px + 12, top: py + 6 });
            } else {
                setTooltipPos(null);
            }
            draw();
        };

        const onClick = (e: MouseEvent) => {
            const r = rect();
            const px = e.clientX - r.left;
            const py = e.clientY - r.top;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const data = pixelToData(px, py, width, height);
            // add new point
            setPoints((prev) => [...prev, { x: Number(data.x.toFixed(4)), y: Number(data.y.toFixed(4)) }]);
            // clear manual overrides when adding point (so animation applies to new regression)
            setManualM(null);
            setManualB(null);
            setTimeout(() => {
                // small delay to let points update and compute regression
                setIsAnimating(true);
                setShowResiduals(true);
            }, 50);
        };

        canvas.addEventListener("mousemove", onMove);
        canvas.addEventListener("mouseleave", () => {
            setHoverIdx(null);
            setTooltipPos(null);
            draw();
        });
        canvas.addEventListener("click", onClick);

        return () => {
            canvas.removeEventListener("mousemove", onMove);
            canvas.removeEventListener("click", onClick);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points, currentM, currentB, getDomain]);

    // sliders manual control
    useEffect(() => {
        if (manualM !== null) setCurrentM(manualM);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manualM]);
    useEffect(() => {
        if (manualB !== null) setCurrentB(manualB);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manualB]);

    // UI handlers
    const addPointFromInputs = () => {
        const x = parseFloat((document.getElementById("inpX") as HTMLInputElement).value || "");
        const y = parseFloat((document.getElementById("inpY") as HTMLInputElement).value || "");
        if (Number.isFinite(x) && Number.isFinite(y)) {
            setPoints((p) => [...p, { x, y }]);
            setManualM(null);
            setManualB(null);
            setIsAnimating(true);
            setShowResiduals(true);
        }
    };
    const clearPoints = () => {
        setPoints([]);
        setManualM(null);
        setManualB(null);
        setCurrentM(0);
        setCurrentB(0);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Linear Regression — Interactive Visualiser</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Left Chart */}
                <div className="md:col-span-2 p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-lg font-semibold">Regression Equation</h2>
                            <div className="text-sm text-gray-600">
                                y = <span className="text-red-600 font-medium">{currentM.toFixed(4)}</span> × x +{" "}
                                <span className="text-red-600 font-medium">{currentB.toFixed(4)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Total SSE: {totalError.toFixed(4)}</div>
                        </div>

                        <div className="text-right text-xs text-gray-500">
                            Points: <span className="font-medium text-gray-800">{points.length}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <canvas
                            ref={canvasRef}
                            style={{ width: "100%", height: 420 }}
                            className="w-full rounded bg-white border"
                        />
                        {/* Tooltip */}
                        {hoverIdx !== null && tooltipPos && (
                            <div
                                style={{ left: tooltipPos.left, top: tooltipPos.top }}
                                className="absolute pointer-events-none bg-white border text-xs p-2 rounded shadow"
                            >
                                <div>
                                    <span className="font-medium">Point</span> #{hoverIdx + 1}
                                </div>
                                <div className="text-sm">
                                    x: {points[hoverIdx].x.toFixed(3)}, y: {points[hoverIdx].y.toFixed(3)}
                                </div>
                                <div className="text-sm text-green-600">
                                    res: {(points[hoverIdx].y - (currentM * points[hoverIdx].x + currentB)).toFixed(4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right controls / info */}
                <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="font-semibold mb-2">How the Best Fit Line Works</h3>
                        <ol className="list-decimal ml-4 text-sm text-gray-600">
                            <li>Compute slope m and intercept b using least squares.</li>
                            <li>{'Animate the red line from current -> computed (press Animate BFL).'}</li>

                            <li>Residuals (green dashed) show distance from point to line.</li>
                            <li>Click canvas to add points; sliders allow manual tuning.</li>
                        </ol>
                    </div>

                    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="font-semibold mb-2">Data Points</h3>
                        <div className="h-40 overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-600">
                                        <th className="text-left px-2">X</th>
                                        <th className="text-left px-2">Y</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.map((p, i) => (
                                        <tr key={i}>
                                            <td className="px-2">{p.x}</td>
                                            <td className="px-2">{p.y}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom controls */}
            <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-wrap gap-3 items-center mb-3">
                    <input id="inpX" placeholder="X value" className="border p-2 rounded w-24" />
                    <input id="inpY" placeholder="Y value" className="border p-2 rounded w-24" />
                    <button onClick={addPointFromInputs} className="bg-blue-600 text-white px-4 py-2 rounded">
                        Add Point
                    </button>
                    <button onClick={clearPoints} className="bg-red-500 text-white px-4 py-2 rounded">
                        Clear Data
                    </button>

                    <button
                        onClick={() => {
                            setIsAnimating(true);
                            setShowResiduals(true);
                            setManualM(null);
                            setManualB(null);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                        Animate BFL
                    </button>

                    <label className="flex items-center gap-2 ml-4">
                        <input
                            type="checkbox"
                            checked={showResiduals}
                            onChange={(e) => setShowResiduals(e.target.checked)}
                        />
                        <span className="text-sm">Show Residuals</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div>
                        <div className="text-sm mb-1">Animation Speed</div>
                        <input
                            type="range"
                            min={1}
                            max={100}
                            value={animSpeed}
                            onChange={(e) => setAnimSpeed(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <div className="text-sm mb-1">Manual Slope (m)</div>
                        <input
                            type="range"
                            min={-5}
                            max={5}
                            step={0.01}
                            value={manualM ?? currentM}
                            onChange={(e) => {
                                setManualM(Number(e.target.value));
                                setIsAnimating(false);
                            }}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <div className="text-sm mb-1">Manual Intercept (b)</div>
                        <input
                            type="range"
                            min={-10}
                            max={10}
                            step={0.01}
                            value={manualB ?? currentB}
                            onChange={(e) => {
                                setManualB(Number(e.target.value));
                                setIsAnimating(false);
                            }}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
