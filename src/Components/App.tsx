import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AssignmentDetails from './AssignmentDetails';
import { Box, Toolbar, Fade } from '@mui/material';
import EvaluationPanel from './EvaluationPanel';

interface AssignmentType {
  assignment_no: number;
  assignment_name: string;
  assignment_date: string;
  assignment_percent: number;
  correct_output: string;
  args?: string;
}

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentType | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const goToHome = () => {
    setSelectedAssignment(null);
  };

  const handleAssignmentClick = (assignment: AssignmentType) => {
    setSelectedAssignment(assignment);
    // On mobile, close the sidebar after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar 
        toggleSidebar={toggleSidebar} 
        goToHome={goToHome} 
      />
      <Sidebar 
        open={sidebarOpen} 
        onAssignmentClick={handleAssignmentClick} 
        onClose={closeSidebar}
      />
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3
        }}
      >
        <Toolbar /> {/* Provides spacing below AppBar */}
        
        {selectedAssignment ? (
          <Fade in={true} timeout={500}>
            <div>
              <AssignmentDetails assignment={selectedAssignment} />
            </div>
          </Fade>
        ) : (
          <Fade in={true} timeout={500}>
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
           {/* ... 
              <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-600">Welcome to OmnIDE</h1>
                <p className="mt-4 text-gray-600">Your next generation IDE</p>
                <p className="mt-2 text-gray-500">Select an assignment from the sidebar to view details</p>
              </div>
            */}
              <div>
                <EvaluationPanel />
              </div>
            </div>
          </Fade>
        )}
      </Box>
    </Box>
  );
};
export default App;