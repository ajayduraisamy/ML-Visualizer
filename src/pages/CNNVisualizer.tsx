import React, { useEffect, useRef, useState } from "react";

// CNN Visualizer Component
const CNNVisualizer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [step, setStep] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const animationRef = useRef<number | null>(null);

    // CNN Layers
    const layers = ["Input Image", "Convolution", "Activation (ReLU)", "Pooling", "Flatten", "Dense Layer", "Output"];

    // Simulate CNN animation
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Step-wise animation visuals
        if (step === 0) {
            ctx.fillStyle = "#3498db";
            ctx.fillRect(100, 100, 200, 200);
            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.fillText("Input Image", 130, 180);
        } else if (step === 1) {
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(300, 100, 200, 200);
            ctx.fillStyle = "#fff";
            ctx.fillText("Convolution", 330, 180);
        } else if (step === 2) {
            ctx.fillStyle = "#f39c12";
            ctx.fillRect(500, 100, 200, 200);
            ctx.fillStyle = "#fff";
            ctx.fillText("ReLU Activated", 520, 180);
        } else if (step === 3) {
            ctx.fillStyle = "#9b59b6";
            ctx.fillRect(700, 100, 200, 200);
            ctx.fillStyle = "#fff";
            ctx.fillText("Pooling", 750, 180);
        } else if (step === 4) {
            ctx.fillStyle = "#1abc9c";
            ctx.fillRect(400, 350, 200, 100);
            ctx.fillStyle = "#fff";
            ctx.fillText("Flatten", 470, 410);
        } else if (step === 5) {
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(400, 500, 200, 100);
            ctx.fillStyle = "#fff";
            ctx.fillText("Dense Layer", 440, 560);
        } else if (step === 6) {
            ctx.fillStyle = "#16a085";
            ctx.beginPath();
            ctx.arc(500, 650, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.fillText("Output", 470, 655);
        }
    };

    // Animation loop
    const loop = () => {
        draw();
        if (isRunning) {
            setStep((prev) => (prev + 1) % layers.length);
            animationRef.current = requestAnimationFrame(loop);
        }
    };

    const start = () => {
        if (!isRunning) {
            setIsRunning(true);
            animationRef.current = requestAnimationFrame(loop);
        }
    };

    const stop = () => {
        setIsRunning(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const reset = () => {
        stop();
        setStep(0);
        draw();
    };

    useEffect(() => {
        draw();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [step]);

    return (
        <div className="page">
            <section className="card">
                <h2>CNN Visualizer</h2>
                <p className="small">Visualize how Convolutional Neural Networks process data layer by layer.</p>

                <div className="controls">
                    <button onClick={start}>Start</button>
                    <button onClick={stop}>Stop</button>
                    <button onClick={reset}>Reset</button>
                </div>

                <div className="small">Current Step: <b>{layers[step]}</b></div>
            </section>

            <section className="card canvas-wrap">
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={800}
                    style={{ width: "100%", height: 600 }}
                ></canvas>
            </section>
        </div>
    );
};

export default CNNVisualizer;
