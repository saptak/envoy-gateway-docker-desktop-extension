import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Drawer, useTheme } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import Sidebar from './Sidebar';
import ConnectionStatus from './ConnectionStatus';
import NotificationCenter from './NotificationCenter';
import UserMenu from './UserMenu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.ui);
  const { connected } = useAppSelector(state => state.system);

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  // Get page title from current route
  const getPageTitle = (): string => {
    const path = location.pathname;
    if (path.startsWith('/gateways')) return 'Gateways';
    if (path.startsWith('/routes')) return 'Routes';
    if (path.startsWith('/containers')) return 'Containers';
    if (path.startsWith('/monitoring')) return 'Monitoring';
    if (path.startsWith('/testing')) return 'Testing';
    if (path.startsWith('/configuration')) return 'Configuration';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Overview';
  };

  const sidebarWidth = 280;
  const collapsedSidebarWidth = 64;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth}px)`,
          ml: `${sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth}px`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleSidebarToggle}
            edge="start"
            sx={{ color: theme.palette.text.primary }}
          >
            {sidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              ml: 2,
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {getPageTitle()}
          </Typography>

          {/* Right side of toolbar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ConnectionStatus />
            <NotificationCenter />
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarCollapsed ? collapsedSidebarWidth : sidebarWidth,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
          marginTop: '64px', // Toolbar height
        }}
      >
        <Box sx={{ p: 3, height: 'calc(100vh - 64px)' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
