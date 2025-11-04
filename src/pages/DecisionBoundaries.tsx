import React, { useEffect, useRef, useState } from "react";

/**
 * Decision Boundaries Visualiser
 * Demonstrates how different classifiers separate 2D data points.
 */
const DecisionBoundaries: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animRef = useRef<number | null>(null);
    const running = useRef(false);

    const [points, setPoints] = useState<{ x: number; y: number; label: number }[]>(
        Array.from({ length: 50 }).map(() => ({
            x: Math.random(),
            y: Math.random(),
            label: Math.random() > 0.5 ? 1 : 0,
        }))
    );

    const [lr, setLr] = useState(0.05);
    const [mode, setMode] = useState<"linear" | "poly" | "nn">("linear");

    // Linear model: y = w1*x + w2*y + b
    const [w, setW] = useState<[number, number]>([Math.random(), Math.random()]);
    const [b, setB] = useState(Math.random() * 0.2 - 0.1);

    // Helper math
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
    const dsigmoid = (x: number) => x * (1 - x);

    // Helper: generate polynomial features
    const polyFeatures = (x: number, y: number) => [x, y, x * x, y * y, x * y];

    // For NN Mode
    const [nn, setNn] = useState({
        w1: Array.from({ length: 5 }, () => [Math.random(), Math.random()]),
        b1: Array.from({ length: 5 }, () => Math.random() * 0.2 - 0.1),
        w2: Array.from({ length: 5 }, () => Math.random() * 0.2 - 0.1),
        b2: Math.random() * 0.2 - 0.1,
    });

    // Predict function
    const predict = (x: number, y: number) => {
        if (mode === "linear") {
            const z = w[0] * x + w[1] * y + b;
            return sigmoid(z);
        } else if (mode === "poly") {
            const f = polyFeatures(x, y);
            const weights = [w[0], w[1], 0.2, -0.3, 0.1];
            const z = f.reduce((s, v, i) => s + v * weights[i], b);
            return sigmoid(z);
        } else {
            // Simple NN
            const { w1, b1, w2, b2 } = nn;
            const hidden = w1.map(
                (weights, i) => sigmoid(weights[0] * x + weights[1] * y + b1[i])
            );
            const out = sigmoid(hidden.reduce((s, h, i) => s + h * w2[i], b2));
            return out;
        }
    };

    // Training step
    function stepTrain() {
        if (mode === "linear") {
            let dw = [0, 0];
            let db = 0;

            points.forEach(({ x, y, label }) => {
                const pred = predict(x, y);
                const error = label - pred;
                const grad = error * dsigmoid(pred);
                dw[0] += grad * x;
                dw[1] += grad * y;
                db += grad;
            });

            setW(([w1, w2]) => [w1 + lr * dw[0], w2 + lr * dw[1]]);
            setB((prev) => prev + lr * db);
        } else if (mode === "nn") {
            const { w1, b1, w2, b2 } = nn;
            const newW1 = [...w1];
            const newB1 = [...b1];
            const newW2 = [...w2];
            let newB2 = b2;

            points.forEach(({ x, y, label }) => {
                const hidden = w1.map(
                    (weights, i) => sigmoid(weights[0] * x + weights[1] * y + b1[i])
                );
                const out = sigmoid(hidden.reduce((s, h, i) => s + h * w2[i], b2));
                const err = label - out;
                const dOut = err * dsigmoid(out);

                for (let i = 0; i < w1.length; i++) {
                    newW2[i] += lr * dOut * hidden[i];
                    const dHidden = dOut * w2[i] * dsigmoid(hidden[i]);
                    newW1[i][0] += lr * dHidden * x;
                    newW1[i][1] += lr * dHidden * y;
                    newB1[i] += lr * dHidden;
                }
                newB2 += lr * dOut;
            });

            setNn({ w1: newW1, b1: newB1, w2: newW2, b2: newB2 });
        }
    }

    // Draw visualization
    function draw() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const wCanvas = canvas.width;
        const hCanvas = canvas.height;

        const img = ctx.createImageData(wCanvas, hCanvas);
        for (let i = 0; i < wCanvas; i++) {
            for (let j = 0; j < hCanvas; j++) {
                const x = i / wCanvas;
                const y = 1 - j / hCanvas;
                const out = predict(x, y);
                const c = Math.floor(out * 255);
                const idx = (j * wCanvas + i) * 4;
                img.data[idx] = c;
                img.data[idx + 1] = 0;
                img.data[idx + 2] = 255 - c;
                img.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);

        // Draw points
        points.forEach(({ x, y, label }) => {
            ctx.beginPath();
            ctx.arc(x * wCanvas, (1 - y) * hCanvas, 6, 0, Math.PI * 2);
            ctx.fillStyle = label ? "#ff4081" : "#00bcd4";
            ctx.fill();
        });
    }

    // Start/Stop/Reset
    function start() {
        if (running.current) return;
        running.current = true;
        const loop = () => {
            stepTrain();
            draw();
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
    }

    function stop() {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        running.current = false;
    }

    function reset() {
        stop();
        setPoints(
            Array.from({ length: 50 }).map(() => ({
                x: Math.random(),
                y: Math.random(),
                label: Math.random() > 0.5 ? 1 : 0,
            }))
        );
        setW([Math.random(), Math.random()]);
        setB(Math.random() * 0.2 - 0.1);
    }

    useEffect(() => {
        draw();
    }, [points, mode, w, b]);

    return (
        <div>
            <section className="card">
                <h2>Decision Boundaries</h2>
                <div className="controls">
                    <label className="small">
                        Learning rate{" "}
                        <input
                            type="range"
                            min={0.001}
                            max={0.5}
                            step={0.001}
                            value={lr}
                            onChange={(e) => setLr(Number(e.target.value))}
                        />
                    </label>
                    <div className="small">Mode: {mode}</div>

                    <div className="mode-buttons">
                        <button onClick={() => setMode("linear")}>Linear</button>
                        <button onClick={() => setMode("poly")}>Polynomial</button>
                        <button onClick={() => setMode("nn")}>Neural Net</button>
                    </div>

                    <button onClick={start}>Start</button>
                    <button onClick={stop}>Stop</button>
                    <button onClick={reset}>Reset</button>
                </div>
            </section>

            <section className="card canvas-wrap">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={480}
                    style={{ width: "100%", height: 480 }}
                    onClick={(e) => {
                        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const y = 1 - (e.clientY - rect.top) / rect.height;
                        setPoints((ps) => [
                            ...ps,
                            { x, y, label: Math.random() > 0.5 ? 1 : 0 },
                        ]);
                    }}
                />
            </section>
        </div>
    );
};

export default DecisionBoundaries;
