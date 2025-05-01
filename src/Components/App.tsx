import React, { useState, useCallback, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AssignmentDetails from './AssignmentDetails';
import { Box, Toolbar, Fade } from '@mui/material';
import EvaluationPanel from './EvaluationPanel';
import { getAllAssignments } from '../services/api';

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
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAllAssignments();
        setAssignments(data.map(assignment => ({
          ...assignment,
          args: assignment.args ?? undefined,
        })));
        
        // Update selected assignment with fresh data if one is selected
        if (selectedAssignment) {
          const updated = data.find(a => a.assignment_no === selectedAssignment.assignment_no);
          if (updated) {
            setSelectedAssignment({
              ...updated,
              args: updated.args ?? undefined,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch assignments:', error);
      }
    };

    fetchAssignments();
  }, [refreshTrigger]);

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

  const refreshAssignments = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleAssignmentUpdate = useCallback(() => {
    refreshAssignments();
  }, [refreshAssignments]);

  const handleAssignmentDelete = useCallback(() => {
    setSelectedAssignment(null);
    refreshAssignments();
  }, [refreshAssignments]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar 
        toggleSidebar={toggleSidebar} 
        goToHome={goToHome} 
        onAssignmentCreated={refreshAssignments}
      />
      <Sidebar 
        open={sidebarOpen} 
        onAssignmentClick={handleAssignmentClick} 
        onClose={closeSidebar}
        assignments={assignments}
        refreshAssignments={refreshAssignments}
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
              <AssignmentDetails 
                assignment={selectedAssignment}
                onAssignmentUpdate={handleAssignmentUpdate}
                onAssignmentDelete={handleAssignmentDelete}
              />
            </div>
          </Fade>
        ) : (
          <Fade in={true} timeout={500}>
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
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