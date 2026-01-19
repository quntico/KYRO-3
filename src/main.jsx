import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from '@/App';
    import '@/index.css';
    import { AuthProvider } from '@/contexts/SupabaseAuthContext';
    import { Toaster } from "@/components/ui/toaster";
    import { DataProvider } from '@/contexts/DataContext';
    import { SettingsProvider } from '@/contexts/SettingsContext';

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <AuthProvider>
          <SettingsProvider>
            <DataProvider>
              <App />
              <Toaster />
            </DataProvider>
          </SettingsProvider>
        </AuthProvider>
      </React.StrictMode>
    );