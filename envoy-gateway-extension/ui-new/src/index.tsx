import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { store } from './store';
import App from './App';

const ddClient = createDockerDesktopClient();

// Create a custom theme based on Docker Desktop colors
const dockerTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0078d4',
    },
    secondary: {
      main: '#1f6feb',
    },
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          border: '1px solid #3e3e3e',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          borderBottom: '1px solid #3e3e3e',
        },
      },
    },
  },
});

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={dockerTheme}>
      <CssBaseline />
      <App ddClient={ddClient} />
    </ThemeProvider>
  </Provider>,
  document.getElementById('root')
);
