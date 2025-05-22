import './index.css';
import './styles/global.less';
import './init';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';

// Main app initialization
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize stagewise toolbar only in development mode
if (process.env.NODE_ENV === 'development') {
  import('@stagewise/toolbar-react').then(({ StagewiseToolbar }) => {
    const stagewiseConfig = {
      plugins: [],
    };

    // Create a separate DOM element for the toolbar
    const stagewiseRoot = document.createElement('div');
    stagewiseRoot.id = 'stagewise-toolbar-root';
    document.body.appendChild(stagewiseRoot);

    // Create separate React root for the toolbar
    ReactDOM.createRoot(stagewiseRoot).render(
      <StagewiseToolbar config={stagewiseConfig} />
    );
  });
}
