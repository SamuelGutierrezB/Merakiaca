import Layout from "@/components/layout/Layout";

export default function Cart() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1
          className="text-4xl font-bold text-center mb-4"
          style={{ color: "#2391C3" }}
        >
          Carrito de Compras
        </h1>
        <p className="text-center text-gray-600 mb-12">Tu carrito está vacío</p>

        <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
          <div className="text-6xl mb-6">🛒</div>
          <p className="text-xl text-gray-600 mb-6">
            Aún no has agregado productos a tu carrito
          </p>
          <a
            href="/productos"
            className="inline-flex items-center gap-3 bg-[#2391C3] hover:bg-[#1A6B8E] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            Ver Productos
          </a>
        </div>
      </div>
    </Layout>
  );
}
