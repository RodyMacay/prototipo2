import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { user, theme } = useAuthStore();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const isPsychologist = theme === 'psychologist';

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isPsychologist 
        ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
        : 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900'
    }`}>
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          <div className={`text-8xl font-bold mb-4 ${
            isPsychologist ? 'text-blue-600' : 'text-white'
          }`}>
            404
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            isPsychologist ? 'text-gray-900' : 'text-white'
          }`}>
            {isPsychologist ? 'Página no encontrada' : '¡Ups! Te perdiste en el espacio'}
          </h1>
          <p className={`${
            isPsychologist ? 'text-gray-600' : 'text-white/80'
          } mb-6`}>
            {isPsychologist 
              ? 'La página que buscas no existe en el sistema.'
              : '¡Esta área del mundo mágico aún no existe!'}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => window.history.back()}
            variant={isPsychologist ? "outline" : "ghost"}
            className={`w-full ${
              isPsychologist 
                ? 'border-blue-200 text-blue-700 hover:bg-blue-50' 
                : 'text-white hover:bg-white/20 border-white/20'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atrás
          </Button>

          <Button
            onClick={() => window.location.href = '/'}
            className={`w-full ${
              isPsychologist 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            {isPsychologist ? 'Ir al Dashboard' : 'Volver al Mundo Mágico'}
          </Button>
        </div>

        {!isPsychologist && (
          <div className="mt-8 text-white/60 text-sm">
            <p>✨ ¡Recuerda explorar las islas desbloqueadas!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
