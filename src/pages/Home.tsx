import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import BranchMap from "@/components/common/BranchMap";
import { getActiveProducts } from "@/services/products.service";
import type { Product } from "@/types";
import logo from "@/assets/logo.png";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  useEffect(() => {
    loadProducts();
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResize = () => {
    if (window.innerWidth >= 1024) {
      setItemsPerView(3);
    } else if (window.innerWidth >= 640) {
      setItemsPerView(2);
    } else {
      setItemsPerView(1);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getActiveProducts();
      setProducts(data.slice(0, 6)); // Máximo 6 productos para el carrusel
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, products.length - itemsPerView);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, products.length - itemsPerView);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const visibleProducts = products.slice(
    currentIndex,
    currentIndex + itemsPerView,
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section id="inicio" className="max-w-7xl mx-auto px-4 py-8 sm:py-16">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
              style={{ color: "#2391C3" }}
            >
              Meraki{" "}
              <span className="text-3xl sm:text-4xl lg:text-5xl">aca®</span>
            </h1>
            <p
              className="text-xl sm:text-2xl mb-4 sm:mb-6"
              style={{ color: "#8A4A86" }}
            >
              Cojines Herbales con Alma, Creatividad y Amor
            </p>
            <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 leading-relaxed">
              Experimenta el bienestar natural con nuestros cojines herbales
              artesanales. Cada pieza está creada con dedicación y amor,
              utilizando semillas y hierbas 100% naturales para tu relajación y
              bienestar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="#productos"
                className=" border-[#2391C3] text-[#2391C3] hover:bg-[#2391C3] hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-colors text-center"
              ></a>
              <Link
                to="/productos"
                className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-colors shadow-lg text-center"
              >
                Ver Productos
              </Link>
            </div>
          </div>

          {/* Imagen principal */}
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#F5E63C]">
            <img
              src={logo}
              alt="Cojines Herbales Meraki aca"
              className="rounded-2xl w-full h-64 sm:h-80 md:h-96 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ color: "#2391C3" }}
          >
            ¿Por qué Meraki <span className="text-2xl sm:text-3xl">aca</span>?
          </h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Creamos cada cojín herbal con dedicación, usando ingredientes
            naturales de la más alta calidad
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#4A9E7C] to-[#4A9E7C]/70 text-white shadow-lg">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold mb-3">100% Natural</h3>
              <p>
                Hierbas y semillas cuidadosamente seleccionadas, 100% naturales
                para tu bienestar
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-[#2391C3] to-[#2391C3]/70 text-white shadow-lg">
              <div className="text-5xl mb-4">💆‍♀️</div>
              <h3 className="text-2xl font-bold mb-3">Relajación</h3>
              <p>
                Aroma natural pensado para acompañar momentos de relajación y
                descanso.
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
      <section id="productos" className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        <h2
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
          style={{ color: "#2391C3" }}
        >
          Nuestros Productos
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base">
          Descubre nuestra colección de cojines herbales
        </p>

        {/* Carrusel de Productos */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="relative mb-8 sm:mb-12">
            {/* Flecha Izquierda */}
            {products.length > itemsPerView && (
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-10 bg-white hover:bg-[#2391C3] text-[#2391C3] hover:text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Anterior"
              >
                <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}

            {/* Productos Visibles */}
            <div className="overflow-hidden px-4 sm:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 transition-transform duration-300">
                {visibleProducts.map((product, idx) => (
                  <ProductCard
                    key={`${product.id}-${currentIndex}-${idx}`}
                    product={product}
                  />
                ))}
              </div>
            </div>

            {/* Flecha Derecha */}
            {products.length > itemsPerView && (
              <button
                onClick={nextSlide}
                disabled={currentIndex >= products.length - itemsPerView}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-10 bg-white hover:bg-[#2391C3] text-[#2391C3] hover:text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Siguiente"
              >
                <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}

            {/* Indicadores */}
            {products.length > itemsPerView && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({
                  length: Math.ceil(products.length - itemsPerView + 1),
                }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-8 bg-[#2391C3]"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Ir a la página ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No hay productos disponibles
          </div>
        )}

        {/* CTA Catálogo */}
        <div className="text-center bg-gradient-to-r from-[#2391C3] to-[#8A4A86] rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-white shadow-2xl">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            ¿Quieres conocer todos nuestros productos?
          </h3>
          <p className="text-base sm:text-xl mb-4 sm:mb-6">
            Explora nuestro catálogo completo en línea
          </p>
          <Link
            to="/productos"
            className="inline-flex items-center justify-center gap-3 bg-white hover:bg-[#F5E63C] text-[#2391C3] font-bold px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-xl transition-colors shadow-lg"
          >
            Ver Catálogo en Línea
          </Link>
          <p className="text-xs sm:text-sm mt-3 sm:mt-4 opacity-90">
            También disponible{" "}
            <a
              href="/catalogo.pdf"
              target="_blank"
              className="underline hover:text-[#F5E63C]"
            >
              en formato PDF
            </a>
          </p>
        </div>
      </section>

      {/* Instrucciones de Uso */}
      <section className="bg-gradient-to-br from-[#E8DFCA] to-[#F5E63C]/20 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ color: "#2391C3" }}
          >
            Instrucciones de Uso
          </h2>
          <p className="text-center text-gray-700 mb-8 sm:mb-12 max-w-2xl mx-auto text-base font-medium">
            Cojín Herbal (compresa para masaje)
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Uso en Caliente */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#D7322D]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">🔥</div>
                <h3 className="text-2xl font-bold text-[#D7322D]">
                  Uso en caliente:
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#2391C3] font-bold">•</span>
                  <span>
                    Calentar en microondas en intervalos de 30 segundos a 1
                    minuto.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2391C3] font-bold">•</span>
                  <span>
                    Revisar la temperatura antes de aplicar sobre la piel.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2391C3] font-bold">•</span>
                  <span>
                    Usar preferentemente con una funda o tela intermedia.
                  </span>
                </li>
              </ul>
            </div>

            {/* Uso en Frío */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#2391C3]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">❄️</div>
                <h3 className="text-2xl font-bold text-[#2391C3]">
                  Uso en frío:
                </h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#8A4A86] font-bold">•</span>
                  <span>
                    Colocar la almohadilla en una bolsa plástica sellada.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8A4A86] font-bold">•</span>
                  <span>Guardar en el congelador por al menos 1 hora.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8A4A86] font-bold">•</span>
                  <span>Aplicar sobre la zona deseada.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Precauciones */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>⚠️</span> Precauciones
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  No sobrecalentar (riesgo de quemaduras o daño al producto).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  No mojar ni introducir al microondas si presenta humedad.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Supervisar el uso en niños y adultos mayores.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>No usar sobre piel lesionada o irritada.</span>
              </li>
            </ul>
          </div>

          {/* Información Comercial */}
          <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-gray-700 mb-4">
              <strong className="text-[#2391C3]">
                Hecho en México por Meraki aca®
              </strong>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Materiales: Semillas, hierbas naturales y tela de algodón
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://instagram.com/MerakiACA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#8A4A86] hover:text-[#6A3A66] font-semibold transition-colors"
              >
                <span className="text-2xl">📱</span>
                @MerakiACA
              </a>
              <a
                href="https://wa.me/523312251720"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#25D366] hover:text-[#20BA5A] font-semibold transition-colors"
              >
                <span className="text-2xl">💬</span>
                33-12-25-17-20
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Sucursales */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ color: "#2391C3" }}
          >
            Casa Blanca Sucursales
          </h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Entregas locales en Casa Blanca. Recoge tu pedido en la sucursal más
            cercana
          </p>

          <BranchMap
            showTitle={false}
            className="max-w-5xl mx-auto"
            selectedBranchId={selectedBranch}
            onSelectBranch={setSelectedBranch}
          />
        </div>
      </section>
    </Layout>
  );
}
