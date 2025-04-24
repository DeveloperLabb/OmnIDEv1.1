import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Navbar: React.FC = () => {
  const handleAddAssignment = () => {
    // TODO: Implement add assignment logic
    console.log('Add assignment clicked');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          width="100%"
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddAssignment}
            sx={{
              backgroundColor: 'white',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              fontWeight: 'bold',
            }}
          >
            Add Assignment
          </Button>

          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            OmnIDE
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;