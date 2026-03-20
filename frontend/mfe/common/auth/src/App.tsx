import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, AuthState } from './store/authStore';

import { LoginPage } from './views/LoginPage';
import { SelectionPage } from './views/SelectionPage';

const App: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();

  const handleSelection = (type: 'personal' | 'business' | 'enterprise') => {
    if (type === 'personal') {
      // Navigate via hard reload so the proxy can serve the Personal Next.js app
      window.location.href = '/personal/home';
    } else if (type === 'business') {
      // Navigate via hard reload so the proxy can serve the Business Next.js app
      window.location.href = '/business/store';
    } else {
      // Enterprise: Next.js on :3004 with basePath="/enterprise"
      // Must use a full browser navigation so the separate Next.js process
      // on :3004 can serve its own HTML/JS correctly.
      // Use /enterprise/ with trailing slash to match Next.js basePath exactly
      window.location.href = '/enterprise/';
    }
  };

  if (!mounted) {
    return null;
  }

  if (isAuthenticated) {
    return <SelectionPage onSelect={handleSelection} />;
  }

  return <LoginPage />;
};

export default App;
