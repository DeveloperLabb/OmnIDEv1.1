import React, { useState, useCallback, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AssignmentDetails from './AssignmentDetails';
import { Box, Toolbar, Fade } from '@mui/material';
import EvaluationPanel from './EvaluationPanel';
import AssignmentScores from './AssignmentScores';
import StudentScores from './StudentScores';
import LoadingScreen from './LoadingScreen';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentType | null>(null);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentView, setCurrentView] = useState('home');

  // Initial application loading
  useEffect(() => {
    const handleAPIReady = () => {
      console.log("API ready event captured");
      // Give a slight delay to ensure everything is ready
      setTimeout(() => setIsLoading(false), 800);
    };

    // Add a timeout fallback in case the event never fires
    const fallbackTimer = setTimeout(() => {
      console.log("Fallback timer triggered - forcing app to load");
      setIsLoading(false);
    }, 5000); // 5 seconds fallback timeout

    // Check if API is already ready
    if (window.apiReady) {
      console.log("API was already ready");
      handleAPIReady();
    } else {
      // Otherwise listen for the event
      console.log("Waiting for api-ready event...");
      window.addEventListener('api-ready', handleAPIReady);
    }

    return () => {
      window.removeEventListener('api-ready', handleAPIReady);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Fetch all assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (isLoading) return; // Don't fetch if app is still initializing

      setIsDataLoading(true);
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
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchAssignments();
  }, [refreshTrigger, isLoading, selectedAssignment]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const goToHome = () => {
    setCurrentView('home');
    setSelectedAssignment(null);
  };

  const handleAssignmentClick = (assignment: AssignmentType) => {
    setSelectedAssignment(assignment);
    setCurrentView('details');
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

  const handleMenuItemClick = (path: string) => {
    setCurrentView(path);
    setSelectedAssignment(null);
    // On mobile, close the sidebar after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // If app is loading, show the full-screen loader
  if (isLoading) {
    return <LoadingScreen message="Initializing OmniDE..." />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {isDataLoading && <LoadingScreen message="Loading data..." />}

      <Navbar 
        toggleSidebar={toggleSidebar} 
        goToHome={goToHome} 
        onAssignmentCreated={refreshAssignments}
      />
      <Sidebar 
        open={sidebarOpen} 
        onAssignmentClick={handleAssignmentClick}
        onMenuItemClick={handleMenuItemClick}
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
        
        {currentView === 'scores' ? (
          <AssignmentScores />
        ) : currentView === 'student-reports' ? (
          <StudentScores />
        ) : selectedAssignment ? (
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
            <div>
              <EvaluationPanel />
            </div>
          </Fade>
        )}
      </Box>
    </Box>
  );
};

export default App;