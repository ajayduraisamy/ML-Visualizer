// src/pages/NeuralNetworks.tsx
import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Neural Network XOR Visualizer
 * - Trains a small feedforward neural network to learn XOR
 * - Visualizes neurons, connections, activations, and weights
 * - Includes explanation + test + training panels
 */

type Example = { inputs: [number, number]; target: number };
const XOR_DATA: Example[] = [
    { inputs: [0, 0], target: 0 },
    { inputs: [0, 1], target: 1 },
    { inputs: [1, 0], target: 1 },
    { inputs: [1, 1], target: 0 },
];

const WIDTH = 380;
const HEIGHT = 260;

/** Helpers */
const rand = (a = -1, b = 1) => Math.random() * (b - a) + a;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.floor(v)));

export default function NeuralNetworks() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // initialize with sane default so render won't crash
    const initNetwork = () => {
        const w0 = Array(8).fill(0).map(() => rand());
        const w1 = Array(4).fill(0).map(() => rand());
        const b = Array(5).fill(0).map(() => rand());
        return { w0, w1, b };
    };

    const defaults = initNetwork();

    const [weights, setWeights] = useState<number[][]>([defaults.w0, defaults.w1]);
    const [biases, setBiases] = useState<number[]>(defaults.b);
    const [hiddenOutputs, setHiddenOutputs] = useState<number[]>([0.5, 0.5, 0.5, 0.5]);
    const [output, setOutput] = useState<number>(0.5);
    const [epoch, setEpoch] = useState(0);
    const [error, setError] = useState(1);
    const [running, setRunning] = useState(false);
    const [speed, setSpeed] = useState(50);
    const [currentExample, setCurrentExample] = useState<Example>(XOR_DATA[0]);

    useEffect(() => {
        // ensure network is seeded on mount (already seeded above)
        // but keep this to reset visuals if needed
        setHiddenOutputs([0.5, 0.5, 0.5, 0.5]);
        setOutput(0.5);
    }, []);

    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
    const sigmoidDerivative = (x: number) => x * (1 - x);

    const forward = useCallback(
        (inputs: number[]) => {
            // safe guards in case weights not set yet
            const w0 = weights[0] ?? Array(8).fill(0);
            const w1 = weights[1] ?? Array(4).fill(0);
            const b = biases ?? Array(5).fill(0);

            const hidden: number[] = [];
            for (let i = 0; i < 4; i++) {
                // each hidden neuron uses two weights (for 2 inputs) + bias
                const w_ix = (j: number) => w0[i * 2 + j] ?? 0;
                const z = w_ix(0) * inputs[0] + w_ix(1) * inputs[1] + (b[i] ?? 0);
                hidden.push(sigmoid(z));
            }
            const out =
                sigmoid(
                    (w1[0] ?? 0) * hidden[0] +
                    (w1[1] ?? 0) * hidden[1] +
                    (w1[2] ?? 0) * hidden[2] +
                    (w1[3] ?? 0) * hidden[3] +
                    (b[4] ?? 0)
                );
            return { hidden, out };
        },
        [weights, biases]
    );

    const trainStep = useCallback(() => {
        const example = XOR_DATA[Math.floor(Math.random() * XOR_DATA.length)];
        const { hidden, out } = forward(example.inputs);
        const target = example.target;

        const outputError = target - out;
        const outputDelta = outputError * sigmoidDerivative(out);

        // Use existing weights safely
        const w1 = weights[1] ?? Array(4).fill(0);

        const hiddenDeltas = hidden.map((h, i) => sigmoidDerivative(h) * outputDelta * (w1[i] ?? 0));

        const newW1 = [...(weights[1] ?? Array(4).fill(0))];
        for (let i = 0; i < newW1.length; i++) {
            newW1[i] += 0.5 * outputDelta * hidden[i];
        }

        const newW0 = [...(weights[0] ?? Array(8).fill(0))];
        for (let i = 0; i < 4; i++) {
            newW0[i * 2] += 0.5 * hiddenDeltas[i] * example.inputs[0];
            newW0[i * 2 + 1] += 0.5 * hiddenDeltas[i] * example.inputs[1];
        }

        const newBiases = [...(biases ?? Array(5).fill(0))];
        for (let i = 0; i < 4; i++) newBiases[i] += 0.5 * hiddenDeltas[i];
        newBiases[4] += 0.5 * outputDelta;

        setWeights([newW0, newW1]);
        setBiases(newBiases);
        setHiddenOutputs(hidden);
        setOutput(out);
        setEpoch((e) => e + 1);
        setError(Math.abs(outputError));
        setCurrentExample(example);
    }, [forward, weights, biases]);

    useEffect(() => {
        if (!running) return;
        const interval = Math.max(10, 200 - speed);
        const id = setInterval(trainStep, interval);
        return () => clearInterval(id);
    }, [running, trainStep, speed]);

    const resetNetwork = () => {
        const { w0, w1, b } = initNetwork();
        setWeights([w0, w1]);
        setBiases(b);
        setHiddenOutputs([0.5, 0.5, 0.5, 0.5]);
        setOutput(0.5);
        setEpoch(0);
        setError(1);
        setRunning(false);
        setCurrentExample(XOR_DATA[0]);
    };

    const drawNetwork = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true }) ?? null;
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        const neuronRadius = 18;

        const inputPos = [
            { x: 60, y: 100 },
            { x: 60, y: 160 },
        ];
        const hiddenPos = [0, 1, 2, 3].map((i) => ({ x: 190, y: 60 + i * 50 }));
        const outputPos = [{ x: 320, y: 130 }];

        const w0 = weights[0] ?? Array(8).fill(0);
        const w1 = weights[1] ?? Array(4).fill(0);

        // Draw connections (input->hidden)
        inputPos.forEach((inp, i) => {
            hiddenPos.forEach((hid, j) => {
                const w = w0[j * 2 + i] ?? 0;
                ctx.beginPath();
                ctx.moveTo(inp.x + neuronRadius, inp.y);
                ctx.lineTo(hid.x - neuronRadius, hid.y);
                ctx.strokeStyle = w >= 0 ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)";
                ctx.lineWidth = Math.min(4, Math.abs(w) * 2 + 0.5);
                ctx.stroke();
            });
        });

        // Draw connections (hidden->output)
        hiddenPos.forEach((hid, i) => {
            const w = w1[i] ?? 0;
            ctx.beginPath();
            ctx.moveTo(hid.x + neuronRadius, hid.y);
            ctx.lineTo(outputPos[0].x - neuronRadius, outputPos[0].y);
            ctx.strokeStyle = w >= 0 ? "rgba(16,185,129,0.7)" : "rgba(239,68,68,0.7)";
            ctx.lineWidth = Math.min(4, Math.abs(w) * 2 + 0.5);
            ctx.stroke();
        });

        // Draw neurons
        const drawNeuron = (x: number, y: number, act: number, label?: string) => {
            const a = clamp01(act); // clamp to 0..1 for color mapping
            ctx.beginPath();
            ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
            const val = clamp255(a * 255);
            ctx.fillStyle = `rgba(${val},${val},255,0.8)`;
            ctx.fill();
            ctx.strokeStyle = "#4B5563";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = "#111827";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(label ?? act.toFixed(2), x, y + 3);
        };

        // inputs (use precise numbers as labels)
        inputPos.forEach((p, i) =>
            drawNeuron(p.x, p.y, currentExample.inputs[i], currentExample.inputs[i].toString())
        );

        // hidden (use last computed hiddenOutputs or default 0.5)
        hiddenPos.forEach((p, i) => drawNeuron(p.x, p.y, hiddenOutputs[i] ?? 0.5));

        // output
        drawNeuron(outputPos[0].x, outputPos[0].y, output ?? 0.5, (output ?? 0.5).toFixed(2));
    }, [weights, hiddenOutputs, output, currentExample]);

    useEffect(() => {
        drawNetwork();
    }, [drawNetwork]);

    return (
        <div className="w-full px-6 py-8 text-gray-800 dark:text-gray-100">
            <h1 className="text-2xl font-semibold mb-4">Neural Network Learning XOR</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 border dark:border-gray-700 rounded-lg">
                    <h2 className="font-medium mb-2 text-center">Neural Network Visualization</h2>
                    <canvas
                        ref={canvasRef}
                        width={WIDTH}
                        height={HEIGHT}
                        className="mx-auto bg-white dark:bg-gray-800 rounded"
                    />
                </div>

                <div className="p-4 border dark:border-gray-700 rounded-lg space-y-2">
                    <h2 className="font-medium text-center">Training Stats</h2>
                    <p>
                        Epochs: <b>{epoch}</b>
                    </p>
                    <p>
                        Current Error: <b>{error.toFixed(4)}</b>
                    </p>
                    <p>
                        Current Example: [{currentExample.inputs.join(", ")}] → {currentExample.target}
                    </p>
                    <p>
                        Prediction: <b>{output.toFixed(4)}</b>
                    </p>
                    <p>Status: {running ? "Training..." : "Stopped"}</p>
                    <label className="block text-sm">Training Speed</label>
                    <input
                        type="range"
                        min="10"
                        max="190"
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-center gap-4 mt-2">
                        {running ? (
                            <button onClick={() => setRunning(false)} className="bg-red-500 px-4 py-1 rounded text-white">
                                Stop Training
                            </button>
                        ) : (
                            <button onClick={() => setRunning(true)} className="bg-green-600 px-4 py-1 rounded text-white">
                                Start Training
                            </button>
                        )}
                        <button onClick={resetNetwork} className="bg-gray-600 px-4 py-1 rounded text-white">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <h3 className="font-semibold mb-2">Test Network</h3>
                <div className="flex justify-center gap-4 flex-wrap">
                    {XOR_DATA.map((ex, i) => {
                        const { out } = forward(ex.inputs);
                        return (
                            <div
                                key={i}
                                className="border dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            >
                                [{ex.inputs.join(", ")}] → {ex.target} <br />
                                <span className="text-sm">Prediction: {out.toFixed(4)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-12 space-y-6 max-w-3xl mx-auto">
                <section>
                    <h3 className="text-xl font-semibold mb-2">How Neural Networks Work</h3>
                    <p>
                        The XOR (exclusive OR) function outputs 1 when exactly one of its inputs is 1. XOR is not linearly separable — a single neuron can’t solve it. We need at least one hidden layer.
                    </p>
                </section>
                <section>
                    <h4 className="font-semibold mt-4">Network Architecture</h4>
                    <ul className="list-disc ml-6">
                        <li>Input Layer: 2 neurons (binary inputs)</li>
                        <li>Hidden Layer: 4 neurons (sigmoid)</li>
                        <li>Output Layer: 1 neuron (sigmoid)</li>
                    </ul>
                </section>
                <section>
                    <h4 className="font-semibold mt-4">Forward Pass & Backpropagation</h4>
                    <p className="text-sm leading-relaxed">
                        Forward pass computes activations layer by layer. Backpropagation adjusts weights using the error derivative to minimize prediction error.
                    </p>
                </section>
            </div>
        </div>
    );
}
