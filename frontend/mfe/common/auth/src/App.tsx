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
      window.location.href = 'http://localhost:3000/personal/home';
    } else if (type === 'business') {
      router.push('/business/store');
    } else {
      router.push('/enterprise');
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
