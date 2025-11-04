export default function Footer() {
    return (
        <footer className="w-full text-center py-4 text-dark dark:text-white border-t border-gray-300 dark:border-gray-800">
            © {new Date().getFullYear()} ML Visualizer. An educational tool for machine learning concepts.
        </footer>
    );
}
