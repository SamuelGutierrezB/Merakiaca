import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-[#E8DFCA] border-t border-[#E8DFCA]/50 py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <img src={logo} alt="Meraki ACA" className="h-20 w-auto mx-auto mb-6" />
        <p className="text-2xl font-bold mb-2 text-[#D7322D]">Meraki ACA</p>
        <p className="text-gray-700 mb-6 font-medium">
          Cojines Herbales con Alma, Creatividad y Amor
        </p>

        <div className="flex justify-center gap-6 mb-6">
          <span className="text-3xl">🌿</span>
          <span className="text-3xl">🌸</span>
          <span className="text-3xl">💙</span>
          <span className="text-3xl">✨</span>
        </div>

        <p className="text-sm text-gray-600">
          © 2026 Meraki ACA. Hecho con amor en Jalisco, México 🇲🇽
        </p>
      </div>
    </footer>
  );
}
