import React, { useRef, useState, useEffect } from "react";

/**
 * Neural Network Visualiser (React + TS)
 * Shows how a small feedforward NN learns 2D classification
 */
const NeuralNetworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animRef = useRef<number | null>(null);
    const running = useRef(false);

    const [lr, setLr] = useState(0.05);
    const [hiddenNodes, setHiddenNodes] = useState(4);
    const [points, setPoints] = useState<{ x: number; y: number; label: number }[]>(
        Array.from({ length: 40 }).map(() => ({
            x: Math.random(),
            y: Math.random(),
            label: Math.random() > 0.5 ? 1 : 0,
        }))
    );

    // Neural network weights
    const [w1, setW1] = useState(() =>
        Array.from({ length: hiddenNodes }, () => [Math.random(), Math.random()])
    );
    const [b1, setB1] = useState(() =>
        Array.from({ length: hiddenNodes }, () => Math.random() * 0.2 - 0.1)
    );
    const [w2, setW2] = useState(() =>
        Array.from({ length: hiddenNodes }, () => Math.random() * 0.2 - 0.1)
    );
    const [b2, setB2] = useState(Math.random() * 0.2 - 0.1);

    // Activation
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
    const dsigmoid = (x: number) => x * (1 - x);

    // Forward pass
    const forward = (x: number, y: number) => {
        const hidden = w1.map((w, i) => sigmoid(w[0] * x + w[1] * y + b1[i]));
        const output = sigmoid(hidden.reduce((s, h, i) => s + h * w2[i], b2));
        return { hidden, output };
    };

    // Training step
    function stepTrain() {
        const newW1 = [...w1];
        const newB1 = [...b1];
        const newW2 = [...w2];
        let newB2 = b2;

        points.forEach(({ x, y, label }) => {
            const { hidden, output } = forward(x, y);
            const error = label - output;
            const dOutput = error * dsigmoid(output);

            // Update weights for hidden -> output
            for (let i = 0; i < hiddenNodes; i++) {
                newW2[i] += lr * dOutput * hidden[i];
            }
            newB2 += lr * dOutput;

            // Backprop for input -> hidden
            for (let i = 0; i < hiddenNodes; i++) {
                const dHidden = dOutput * w2[i] * dsigmoid(hidden[i]);
                newW1[i][0] += lr * dHidden * x;
                newW1[i][1] += lr * dHidden * y;
                newB1[i] += lr * dHidden;
            }
        });

        setW1(newW1);
        setB1(newB1);
        setW2(newW2);
        setB2(newB2);
    }

    // Draw points and NN decision boundary
    function draw() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;

        // Draw background (decision boundary)
        const img = ctx.createImageData(w, h);
        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                const x = i / w;
                const y = 1 - j / h;
                const { output } = forward(x, y);
                const c = Math.floor(output * 255);
                const idx = (j * w + i) * 4;
                img.data[idx] = c;
                img.data[idx + 1] = 0;
                img.data[idx + 2] = 255 - c;
                img.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);

        // Draw training points
        points.forEach(({ x, y, label }) => {
            ctx.beginPath();
            ctx.arc(x * w, (1 - y) * h, 6, 0, Math.PI * 2);
            ctx.fillStyle = label ? "#ff4081" : "#00bcd4";
            ctx.fill();
        });
    }

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
            Array.from({ length: 40 }).map(() => ({
                x: Math.random(),
                y: Math.random(),
                label: Math.random() > 0.5 ? 1 : 0,
            }))
        );
        setW1(
            Array.from({ length: hiddenNodes }, () => [Math.random(), Math.random()])
        );
        setB1(Array.from({ length: hiddenNodes }, () => Math.random() * 0.2 - 0.1));
        setW2(Array.from({ length: hiddenNodes }, () => Math.random() * 0.2 - 0.1));
        setB2(Math.random() * 0.2 - 0.1);
    }

    useEffect(() => {
        draw();
    }, [points, w1, w2, b1, b2]);

    return (
        <div>
            <section className="card">
                <h2>Neural Networks</h2>
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
                    <div className="small">Hidden Nodes: {hiddenNodes}</div>
                    <button onClick={start}>Start</button>
                    <button onClick={stop}>Stop</button>
                    <button onClick={reset}>Reset</button>
                    <button
                        onClick={() =>
                            setPoints((ps) => [
                                ...ps,
                                {
                                    x: Math.random(),
                                    y: Math.random(),
                                    label: Math.random() > 0.5 ? 1 : 0,
                                },
                            ])
                        }
                    >
                        Add Point
                    </button>
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

export default NeuralNetworks;
