import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-[#000005] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <img
          src={logo}
          alt="Meraki ACA"
          className="h-20 w-auto mx-auto mb-6 brightness-200"
        />
        <p className="text-2xl font-bold mb-2" style={{ color: "#F5E63C" }}>
          Meraki ACA
        </p>
        <p className="text-gray-400 mb-6">
          Cojines Herbales con Alma, Creatividad y Amor
        </p>

        <div className="flex justify-center gap-6 mb-6">
          <span className="text-3xl">🌿</span>
          <span className="text-3xl">🌸</span>
          <span className="text-3xl">💙</span>
          <span className="text-3xl">✨</span>
        </div>

        <p className="text-sm text-gray-500">
          © 2026 Meraki ACA. Hecho con amor en Argentina 🇦🇷
        </p>
      </div>
    </footer>
  );
}
