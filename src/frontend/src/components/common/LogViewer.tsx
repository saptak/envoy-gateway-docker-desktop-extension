import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatRelativeTime } from '@/utils';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

interface LogViewerProps {
  logs: LogEntry[];
  maxHeight?: number;
  showTimestamp?: boolean;
  showComponent?: boolean;
  autoScroll?: boolean;
  onLogClick?: (log: LogEntry) => void;
}

const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  maxHeight = 400,
  showTimestamp = true,
  showComponent = true,
  autoScroll = true,
  onLogClick,
}) => {
  const theme = useTheme();
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <ErrorIcon fontSize="small" sx={{ color: theme.palette.error.main }} />;
      case 'warn':
        return <WarningIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />;
      case 'info':
        return <InfoIcon fontSize="small" sx={{ color: theme.palette.info.main }} />;
      case 'debug':
        return <SuccessIcon fontSize="small" sx={{ color: theme.palette.success.main }} />;
      default:
        return <InfoIcon fontSize="small" sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return theme.palette.error.main;
      case 'warn': return theme.palette.warning.main;
      case 'info': return theme.palette.info.main;
      case 'debug': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  if (logs.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No logs available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ height: maxHeight, overflow: 'hidden' }}>
      <List
        ref={listRef}
        sx={{
          maxHeight,
          overflow: 'auto',
          p: 0,
          '& .MuiListItem-root': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        }}
      >
        {logs.map((log, index) => (
          <ListItem
            key={log.id || index}
            onClick={() => onLogClick?.(log)}
            sx={{
              cursor: onLogClick ? 'pointer' : 'default',
              py: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getLevelIcon(log.level)}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {showTimestamp && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontFamily: 'monospace',
                        minWidth: 80,
                      }}
                    >
                      {formatRelativeTime(log.timestamp)}
                    </Typography>
                  )}
                  
                  {showComponent && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: getLevelColor(log.level),
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        letterSpacing: 0.5,
                        minWidth: 60,
                      }}
                    >
                      {log.component}
                    </Typography>
                  )}
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-word',
                      flex: 1,
                    }}
                  >
                    {log.message}
                  </Typography>
                </Box>
              }
              secondary={
                log.metadata && Object.keys(log.metadata).length > 0 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {JSON.stringify(log.metadata, null, 2)}
                  </Typography>
                )
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default LogViewer;
