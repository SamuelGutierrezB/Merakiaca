import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8DFCA] via-white to-[#E8DFCA] flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Cojines herbales decorativos */}
        <div className="flex justify-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#4A9E7C] opacity-70 animate-pulse shadow-lg flex items-center justify-center">
            <span className="text-2xl">🌿</span>
          </div>
          <div className="w-20 h-20 rounded-full bg-[#2391C3] opacity-80 animate-bounce shadow-xl flex items-center justify-center">
            <span className="text-3xl">💙</span>
          </div>
          <div className="w-16 h-16 rounded-full bg-[#8A4A86] opacity-70 animate-pulse shadow-lg flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>

        {/* Título principal con estilo Meraki */}
        <h1 className="text-7xl font-bold mb-2" style={{ color: "#2391C3" }}>
          Meraki ACA
        </h1>
        <p className="text-lg mb-8" style={{ color: "#8A4A86" }}>
          Cojines Herbales con Alma, Creatividad y Amor
        </p>

        {/* Tarjeta principal cute */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-6 border-4 border-[#F5E63C]">
          <div className="mb-4">
            <span className="text-6xl inline-block animate-bounce">🌸</span>
          </div>
          <p className="text-3xl font-bold mb-3" style={{ color: "#D7322D" }}>
            ¡Estamos preparando algo especial!
          </p>
          <p className="text-gray-600 text-lg mb-4">
            Nuestra tienda está tomando forma con mucho amor y dedicación
          </p>

          {/* Iconos de beneficios */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#4A9E7C] bg-opacity-20 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🌱</span>
              </div>
              <p className="text-xs text-gray-600">100% Natural</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#2391C3] bg-opacity-20 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💆‍♀️</span>
              </div>
              <p className="text-xs text-gray-600">Relajación</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#8A4A86] bg-opacity-20 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-xs text-gray-600">Bienestar</p>
            </div>
          </div>
        </div>

        {/* Mensaje adicional */}
        <div className="bg-white bg-opacity-60 rounded-2xl p-4 inline-block">
          <p className="text-gray-600 text-sm flex items-center gap-2 justify-center">
            <span className="text-lg">🛠️</span>
            Mientras tanto, estamos creando tu experiencia perfecta
            <span className="text-lg">💝</span>
          </p>
        </div>

        {/* Decoración inferior */}
        <div className="mt-8 flex justify-center gap-3 opacity-50">
          <span className="text-2xl">🌿</span>
          <span className="text-2xl">🌸</span>
          <span className="text-2xl">💙</span>
          <span className="text-2xl">🌿</span>
        </div>
      </div>
    </div>
  );
}

export default App;
