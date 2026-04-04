import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-[#E8DFCA] dark:bg-gray-900 border-t border-[#E8DFCA]/50 dark:border-gray-700 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <img src={logo} alt="Meraki aca" className="h-20 w-auto mx-auto mb-6" />
        <p className="text-2xl font-bold mb-2 text-[#8A4A86] dark:text-purple-300">
          Meraki <span className="text-lg">aca®</span>
        </p>
        <p className="text-gray-700 dark:text-gray-400 dark:text-gray-500 mb-6 font-medium">
          Cojines Herbales con Alma, Creatividad y Amor
        </p>

        <div className="flex justify-center gap-6 mb-6">
          <span className="text-3xl">🌿</span>
          <span className="text-3xl">🌸</span>
          <span className="text-3xl">💙</span>
          <span className="text-3xl">✨</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
          © 2026 Meraki <span className="text-xs">aca®</span>. Hecho con amor en
          Jalisco, México 🇲🇽
        </p>
      </div>
    </footer>
  );
}
