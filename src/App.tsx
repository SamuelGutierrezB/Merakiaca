import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center space-x-8 mb-8">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo hover:scale-110 transition-transform" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react hover:scale-110 transition-transform" alt="React logo" />
          </a>
        </div>
        <h1 className="text-4xl font-bold text-white mb-8">Vite + React + Tailwind</h1>
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
          <p className="mt-4 text-gray-200">
            Edit <code className="bg-gray-800 text-yellow-300 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="text-gray-300">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}
}

export default App
