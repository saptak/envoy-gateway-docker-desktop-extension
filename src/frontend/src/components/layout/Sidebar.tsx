import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Router as RouterIcon,
  Route as RouteIcon,
  Storage as ContainerIcon,
  Analytics as AnalyticsIcon,
  BugReport as TestingIcon,
  Settings as SettingsIcon,
  Code as ConfigIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/hooks/redux';
import Logo from '@/components/common/Logo';

interface SidebarProps {
  collapsed: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { gateways } = useAppSelector(state => state.gateways);
  const { routes } = useAppSelector(state => state.routes);
  const { containers } = useAppSelector(state => state.containers);

  const navItems: NavItem[] = [
    {
      path: '/overview',
      label: 'Overview',
      icon: <DashboardIcon />,
    },
    {
      path: '/gateways',
      label: 'Gateways',
      icon: <RouterIcon />,
      badge: gateways.length.toString(),
    },
    {
      path: '/routes',
      label: 'Routes',
      icon: <RouteIcon />,
      badge: routes.length.toString(),
    },
    {
      path: '/containers',
      label: 'Containers',
      icon: <ContainerIcon />,
      badge: containers.filter(c => c.state === 'running').length.toString(),
    },
    {
      path: '/monitoring',
      label: 'Monitoring',
      icon: <AnalyticsIcon />,
    },
    {
      path: '/testing',
      label: 'Testing',
      icon: <TestingIcon />,
    },
    {
      path: '/configuration',
      label: 'Configuration',
      icon: <ConfigIcon />,
    },
  ];

  const utilityItems: NavItem[] = [
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon />,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActiveRoute = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isActiveRoute(item.path);
    
    const listItem = (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          disabled={item.disabled}
          sx={{
            minHeight: 48,
            justifyContent: collapsed ? 'center' : 'initial',
            px: 2.5,
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            backgroundColor: isActive
              ? theme.palette.primary.main + '20'
              : 'transparent',
            color: isActive
              ? theme.palette.primary.main
              : theme.palette.text.primary,
            '&:hover': {
              backgroundColor: isActive
                ? theme.palette.primary.main + '30'
                : theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 3,
              justifyContent: 'center',
              color: 'inherit',
            }}
          >
            {item.icon}
          </ListItemIcon>
          
          {!collapsed && (
            <>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                  },
                }}
              />
              {item.badge && (
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderRadius: '12px',
                    px: 1,
                    py: 0.25,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {item.badge}
                </Box>
              )}
            </>
          )}
        </ListItemButton>
      </ListItem>
    );

    return collapsed ? (
      <Tooltip
        key={item.path}
        title={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
        placement="right"
      >
        {listItem}
      </Tooltip>
    ) : (
      listItem
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
        }}
      >
        <Logo collapsed={collapsed} />
        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              ml: 2,
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Envoy Gateway
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ mt: 1 }}>
          {navItems.map(renderNavItem)}
        </List>

        <Divider sx={{ my: 2 }} />

        <List>
          {utilityItems.map(renderNavItem)}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, mt: 'auto' }}>
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              display: 'block',
            }}
          >
            Envoy Gateway Extension
            <br />
            v1.0.0
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
