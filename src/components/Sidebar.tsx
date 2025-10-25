import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';

export const Sidebar = () => {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const isActive = (path: string) => router.pathname === path;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-700 bg-gray-800 px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Chirp</h1>
      </div>

      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className={`flex items-center gap-4 rounded-full px-6 py-3 text-xl font-semibold transition-colors ${
            isActive('/')
              ? 'bg-blue-500 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <span className="text-2xl">🏠</span>
          <span>Home</span>
        </Link>

        {isSignedIn && (
          <Link
            href="/profile"
            className={`flex items-center gap-4 rounded-full px-6 py-3 text-xl font-semibold transition-colors ${
              isActive('/profile')
                ? 'bg-blue-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-2xl">👤</span>
            <span>Profile</span>
          </Link>
        )}
      </nav>
    </aside>
  );
};
