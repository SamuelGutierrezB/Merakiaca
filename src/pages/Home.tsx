import Layout from "@/components/layout/Layout";
import logo from "@/assets/logo.png";
import img1 from "@/assets/img1.png";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section id="inicio" className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1
              className="text-6xl font-bold mb-4"
              style={{ color: "#2391C3" }}
            >
              Meraki ACA
            </h1>
            <p className="text-2xl mb-6" style={{ color: "#8A4A86" }}>
              Cojines Herbales con Alma, Creatividad y Amor
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Experimenta el bienestar natural con nuestros cojines herbales
              artesanales. Cada pieza está creada con dedicación y amor,
              utilizando ingredientes 100% naturales para tu relajación y
              bienestar.
            </p>
            <div className="flex gap-4">
              <a
                href="/catalogo.pdf"
                target="_blank"
                className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
              >
                Ver Catálogo Completo
              </a>
              <a
                href="#productos"
                className="bg-white border-2 border-[#2391C3] text-[#2391C3] hover:bg-[#2391C3] hover:text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Conocer Más
              </a>
            </div>
          </div>

          {/* Imagen principal */}
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#F5E63C]">
            <img
              src={logo}
              alt="Cojines Herbales Meraki ACA"
              className="rounded-2xl w-full h-96 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-4xl font-bold text-center mb-4"
            style={{ color: "#2391C3" }}
          >
            ¿Por qué Meraki ACA?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Creamos cada cojín herbal con dedicación, usando ingredientes
            naturales de la más alta calidad
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#4A9E7C] to-[#4A9E7C]/70 text-white shadow-lg">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold mb-3">100% Natural</h3>
              <p>
                Ingredientes herbales cuidadosamente seleccionados para tu
                bienestar
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#2391C3] to-[#2391C3]/70 text-white shadow-lg">
              <div className="text-5xl mb-4">💆‍♀️</div>
              <h3 className="text-2xl font-bold mb-3">Relajación</h3>
              <p>
                Aromerapia natural que ayuda a reducir el estrés y mejorar tu
                descanso
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#8A4A86] to-[#8A4A86]/70 text-white shadow-lg">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-2xl font-bold mb-3">Hecho con Amor</h3>
              <p>
                Cada pieza es única, creada artesanalmente con dedicación y
                cariño
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Preview Section */}
      <section id="productos" className="max-w-7xl mx-auto px-4 py-16">
        <h2
          className="text-4xl font-bold text-center mb-4"
          style={{ color: "#2391C3" }}
        >
          Nuestros Productos
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Descubre nuestra colección de cojines herbales
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Placeholder Producto 1 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#E8DFCA] hover:border-[#F5E63C] transition-colors">
            <img
              src={img1}
              alt="Cojín Relajante"
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#000005" }}
              >
                Cojín Relajante
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Perfecto para aliviar el estrés y la tensión
              </p>
              <p className="text-2xl font-bold" style={{ color: "#D7322D" }}>
                Próximamente
              </p>
            </div>
          </div>

          {/* Placeholder Producto 2 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#E8DFCA] hover:border-[#F5E63C] transition-colors">
            <img
              src={img1}
              alt="Cojín Térmico"
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#000005" }}
              >
                Cojín Térmico
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Calor terapéutico para dolores musculares
              </p>
              <p className="text-2xl font-bold" style={{ color: "#D7322D" }}>
                Próximamente
              </p>
            </div>
          </div>

          {/* Placeholder Producto 3 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#E8DFCA] hover:border-[#F5E63C] transition-colors">
            <img
              src={img1}
              alt="Cojín Aromático"
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#000005" }}
              >
                Cojín Aromático
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Aromas naturales para mejorar tu bienestar
              </p>
              <p className="text-2xl font-bold" style={{ color: "#D7322D" }}>
                Próximamente
              </p>
            </div>
          </div>
        </div>

        {/* CTA Catálogo */}
        <div className="text-center bg-gradient-to-r from-[#2391C3] to-[#8A4A86] rounded-3xl p-12 text-white shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            ¿Quieres ver todos nuestros productos?
          </h3>
          <p className="text-xl mb-6">
            Descarga nuestro catálogo completo con precios y detalles
          </p>
          <a
            href="/catalogo.pdf"
            target="_blank"
            className="inline-flex items-center gap-3 bg-[#F5E63C] hover:bg-[#D7322D] text-[#000005] font-bold px-10 py-4 rounded-xl text-xl transition-colors shadow-lg"
          >
            <span>📄</span>
            Descargar Catálogo PDF
          </a>
        </div>
      </section>
    </Layout>
  );
}
