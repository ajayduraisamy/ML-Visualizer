
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import LinearRegression from './pages/LinearRegression'
import DecisionBoundaries from './pages/DecisionBoundaries'
import NeuralNetworks from './pages/NeuralNetworks'
import CNNVisualizer from './pages/CNNVisualizer'
import About from './pages/About'


export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/linear-regression" element={<LinearRegression />} />
          <Route path="/decision-boundaries" element={<DecisionBoundaries />} />
          <Route path="/neural-networks" element={<NeuralNetworks />} />
          <Route path="/cnn-visualizer" element={<CNNVisualizer />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}