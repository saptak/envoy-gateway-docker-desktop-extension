import React from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  BrightnessAuto as AutoModeIcon,
  Help as HelpIcon,
  Info as AboutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { setTheme } from '@/store/slices/uiSlice';

const UserMenu: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme: currentTheme } = useAppSelector(state => state.ui);
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    navigate('/settings');
    handleClose();
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    dispatch(setTheme(newTheme));
    handleClose();
  };

  const handleHelp = () => {
    window.open('https://github.com/saptak/envoy-gateway-docker-desktop-extension/docs', '_blank');
    handleClose();
  };

  const handleAbout = () => {
    // TODO: Implement about dialog
    console.log('About dialog');
    handleClose();
  };

  const getThemeIcon = (themeMode: string) => {
    switch (themeMode) {
      case 'light': return <LightModeIcon fontSize="small" />;
      case 'dark': return <DarkModeIcon fontSize="small" />;
      default: return <AutoModeIcon fontSize="small" />;
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ 
          ml: 2,
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <AccountIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="user-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleThemeChange('light')}>
          <ListItemIcon>
            <LightModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Light Theme</ListItemText>
          {currentTheme === 'light' && '✓'}
        </MenuItem>

        <MenuItem onClick={() => handleThemeChange('dark')}>
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dark Theme</ListItemText>
          {currentTheme === 'dark' && '✓'}
        </MenuItem>

        <MenuItem onClick={() => handleThemeChange('auto')}>
          <ListItemIcon>
            <AutoModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Auto Theme</ListItemText>
          {currentTheme === 'auto' && '✓'}
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleHelp}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Help & Documentation</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleAbout}>
          <ListItemIcon>
            <AboutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>About</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
