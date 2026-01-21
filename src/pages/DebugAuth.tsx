import { useAuthStore } from "@/store/authStore";
import { auth } from "@/services/firebase";

export default function DebugAuth() {
  const { user, loading, initialized, error } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Debug Autenticación</h1>

        <div className="space-y-4">
          <div>
            <h2 className="font-bold">Store State:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(
                {
                  user: user
                    ? {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        role: user.role,
                      }
                    : null,
                  loading,
                  initialized,
                  error,
                },
                null,
                2,
              )}
            </pre>
          </div>

          <div>
            <h2 className="font-bold">Firebase Auth:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(
                {
                  currentUser: auth.currentUser
                    ? {
                        uid: auth.currentUser.uid,
                        email: auth.currentUser.email,
                        displayName: auth.currentUser.displayName,
                      }
                    : null,
                  config: {
                    apiKey: auth.app.options.apiKey?.substring(0, 10) + "...",
                    authDomain: auth.app.options.authDomain,
                    projectId: auth.app.options.projectId,
                  },
                },
                null,
                2,
              )}
            </pre>
          </div>

          <div>
            <h2 className="font-bold">Variables de Entorno:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(
                {
                  VITE_FIREBASE_API_KEY:
                    import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) +
                    "...",
                  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env
                    .VITE_FIREBASE_AUTH_DOMAIN,
                  VITE_FIREBASE_PROJECT_ID: import.meta.env
                    .VITE_FIREBASE_PROJECT_ID,
                  VITE_ADMIN_EMAILS: import.meta.env.VITE_ADMIN_EMAILS,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
