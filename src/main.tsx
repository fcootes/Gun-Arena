import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FactionProvider } from './FactionContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <FactionProvider>
    <App />
  </FactionProvider>
);
