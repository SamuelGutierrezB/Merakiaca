import Layout from "@/components/layout/Layout";

export default function Products() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1
          className="text-4xl font-bold text-center mb-4"
          style={{ color: "#2391C3" }}
        >
          Nuestros Productos
        </h1>
        <p className="text-center text-gray-600 mb-12">
          El catálogo completo estará disponible próximamente
        </p>

        <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
          <div className="text-6xl mb-6">🛍️</div>
          <p className="text-xl text-gray-600 mb-6">
            Estamos trabajando en nuestro catálogo de productos
          </p>
          <a
            href="/catalogo.pdf"
            target="_blank"
            className="inline-flex items-center gap-3 bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            <span>📄</span>
            Ver Catálogo PDF
          </a>
        </div>
      </div>
    </Layout>
  );
}
