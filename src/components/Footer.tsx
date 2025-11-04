export default function Footer() {
    return (
        <footer className="w-full text-center py-4 text-dark dark:text-white">
            © {new Date().getFullYear()} ML Visualizer. An educational tool for machine learning concepts.
        </footer>
    );
}
