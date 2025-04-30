import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Toolbar,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Score as ScoreIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Folder as FolderIcon,
  ExpandLess,
  ExpandMore,
  Description as DescriptionIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onAssignmentClick?: (assignment: AssignmentType) => void;
}

interface AssignmentType {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

const drawerWidth = 240;
const API_BASE_URL = 'http://localhost:8000/api';

const Sidebar: React.FC<SidebarProps> = ({ open, onAssignmentClick }) => {
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/assignments/`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch assignments: ${response.status}`);
        }
        
        const data = await response.json();
        setAssignments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleAssignmentsClick = () => {
    setAssignmentsOpen(!assignmentsOpen);
  };

  const menuItems = [
    { text: 'Scores', icon: <ScoreIcon />, path: '/scores' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    { text: 'Files', icon: <FolderIcon />, path: '/files' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const renderAssignmentsList = () => {
    if (loading) {
      return (
        <ListItem sx={{ pl: 4, display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </ListItem>
      );
    }

    if (error) {
      return (
        <ListItem sx={{ pl: 4, color: 'error.main' }}>
          <ListItemIcon>
            <ErrorIcon color="error" />
          </ListItemIcon>
          <ListItemText primary="Failed to load assignments" secondary="Please try again later" />
        </ListItem>
      );
    }

    if (assignments.length === 0) {
      return (
        <ListItem sx={{ pl: 4 }}>
          <ListItemText primary="No assignments found" />
        </ListItem>
      );
    }

    return assignments.map((assignment) => (
      <ListItemButton 
        key={assignment.assignment_no} 
        sx={{ pl: 4 }}
        onClick={() => onAssignmentClick && onAssignmentClick(assignment)}
      >
        <ListItemIcon>
          <DescriptionIcon />
        </ListItemIcon>
        <ListItemText 
          primary={assignment.assignment_name} 
          secondary={`Due: ${new Date(assignment.assignment_date).toLocaleDateString()} (${assignment.assignment_percent}%)`} 
        />
      </ListItemButton>
    ));
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
    >
      <Toolbar /> {/* This creates space below the AppBar */}
      <Divider />
      <List>
        {/* Assignments with nested items */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleAssignmentsClick}>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Assignments" />
            {assignmentsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={assignmentsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderAssignmentsList()}
          </List>
        </Collapse>

        {/* Other menu items */}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;