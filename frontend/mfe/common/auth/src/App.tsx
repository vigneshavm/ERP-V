import React from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './views/LoginPage';
import { SelectionPage } from './views/SelectionPage';

const App: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelection = (type: 'personal' | 'business' | 'enterprise') => {
    if (type === 'personal') {
      window.location.href = 'http://localhost:3000/personal/home';
    } else if (type === 'business') {
      window.location.href = '/business';
    } else {
      window.location.href = '/enterprise';
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
