import React from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { SelectionPage } from './pages/SelectionPage';

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleSelection = (type: 'personal' | 'business' | 'enterprise') => {
    if (type === 'personal') {
      window.location.href = '/personal/home';
    } else if (type === 'business') {
      window.location.href = '/business';
    } else {
      window.location.href = '/enterprise';
    }
  };

  if (isAuthenticated) {
    return <SelectionPage onSelect={handleSelection} />;
  }

  return <LoginPage />;
};

export default App;
