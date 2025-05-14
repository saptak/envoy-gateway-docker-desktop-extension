import React from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Button,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { removeNotification, clearNotifications } from '@/store/slices/uiSlice';
import { formatRelativeTime } from '@/utils';

const NotificationCenter: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.ui);
  
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRemoveNotification = (id: string) => {
    dispatch(removeNotification(id));
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
    handleClose();
  };

  const unreadCount = notifications.length;
  const recentNotifications = notifications.slice(0, 10);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{ 
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            {notifications.length > 0 && (
              <Button size="small" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {recentNotifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  py: 2,
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={notification.type}
                        size="small"
                        sx={{
                          backgroundColor: getNotificationColor(notification.type) + '20',
                          color: getNotificationColor(notification.type),
                          textTransform: 'capitalize',
                          fontWeight: 600,
                        }}
                      />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600 }}
                      >
                        {notification.title}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveNotification(notification.id)}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {notification.message}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatRelativeTime(notification.timestamp)}
                  </Typography>
                  
                  {notification.actions && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          size="small"
                          variant="outlined"
                          onClick={action.action}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </Box>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {notifications.length > 10 && (
          <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="body2" color="text.secondary">
              {notifications.length - 10} more notifications...
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default NotificationCenter;
