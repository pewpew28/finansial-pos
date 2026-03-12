import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import PosApp from './pos/PosApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PosApp />
  </StrictMode>
);
