import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import ScoreIcon from '@mui/icons-material/Score';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import HelpIcon from '@mui/icons-material/Help';
import StorageIcon from '@mui/icons-material/Storage';

interface UserManualModalProps {
  open: boolean;
  onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="user-manual-title"
    >
      <DialogTitle id="user-manual-title" sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center">
          <HelpIcon sx={{ mr: 1 }} />
          <Typography variant="h5" component="span">
            OmnIDE User Manual
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Welcome to OmnIDE!</Typography>
          <Typography paragraph>
            OmnIDE is an integrated development and evaluation environment designed to manage programming assignments,
            assess student submissions, and track results. This guide provides an overview of OmnIDE's key features.
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <AssignmentIcon color="primary" sx={{ mr: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold">Assignment Management</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              Assignments are the core component of OmnIDE. You can create, edit, and manage assignments for students.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><AssignmentIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Creating Assignments" 
                  secondary="Click the 'Add Assignment' button in the top menu to create a new assignment. You'll need to provide details such as name, due date, percentage of grade, and the expected output."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><AssignmentIcon color="primary" /></ListItemIcon>
                <ListItemText 
                  primary="Viewing and Editing Assignments" 
                  secondary="Access assignments from the sidebar. Click on an assignment to view its details and make changes if needed."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><AssignmentIcon color="secondary" /></ListItemIcon>
                <ListItemText 
                  primary="Command Line Arguments" 
                  secondary="You can specify command line arguments for each assignment that will be passed to student programs during evaluation."
                />
              </ListItem>
            </List>
            
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Assignment Grade Distribution:
            </Typography>
            <Typography variant="body2" paragraph>
              Each assignment contributes to the total grade according to its percentage value. The total of all assignments should equal 100%.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <PlayArrowIcon color="success" sx={{ mr: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold">Evaluation System</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              OmnIDE's evaluation system automatically compiles and runs student submissions, comparing their output with the expected results.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><PlayArrowIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Running Evaluations" 
                  secondary="From the main dashboard, select an assignment (or all assignments) and click 'Run Evaluation' to process student submissions."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><ScoreIcon color="success" /></ListItemIcon>
                <ListItemText 
                  primary="Viewing Results" 
                  secondary="Results are displayed in a table showing student IDs, scores, and match status. You can expand each row to see the detailed output comparison."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><StorageIcon color="info" /></ListItemIcon>
                <ListItemText 
                  primary="Test Data" 
                  secondary="You can initialize test data to quickly set up example assignments and submissions for demonstration purposes."
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="500" gutterBottom>
                Evaluation Logic:
              </Typography>
              <Typography variant="body2">
                The system compares the output of the student's program with the expected output defined in the assignment.
                A perfect match earns 100 points, while any difference results in 0 points. Output comparison is exact, 
                including whitespace and line endings.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <SettingsIcon color="info" sx={{ mr: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold">Configuration</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              OmnIDE supports multiple programming languages, which can be configured through the Configuration panel.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><CodeIcon color="info" /></ListItemIcon>
                <ListItemText 
                  primary="Supported Languages" 
                  secondary="OmnIDE supports C, C++, Java, C#, Python, Go, and JavaScript."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SettingsIcon color="info" /></ListItemIcon>
                <ListItemText 
                  primary="Configuring Compilers/Interpreters" 
                  secondary="Click the 'Configuration' button in the top menu to add or modify compiler/interpreter paths for each language."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SettingsIcon color="info" /></ListItemIcon>
                <ListItemText 
                  primary="Default Paths" 
                  secondary="The system suggests default paths for common installations, but you should verify these are correct for your environment."
                />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <FileDownloadIcon color="action" sx={{ mr: 1.5 }} />
              <Typography variant="subtitle1" fontWeight="bold">Data Management</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph>
              OmnIDE allows you to import and export your data for backup or transfer purposes.
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><FileDownloadIcon color="action" /></ListItemIcon>
                <ListItemText 
                  primary="Exporting Data" 
                  secondary="Click 'Export' in the tools menu to download all your assignments, configurations, and score data as a JSON file."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><FileUploadIcon color="action" /></ListItemIcon>
                <ListItemText 
                  primary="Importing Data" 
                  secondary="Click 'Import' in the tools menu to upload a previously exported JSON file and restore your data."
                />
              </ListItem>
            </List>
            
            <Typography variant="subtitle2" fontWeight="500" color="warning.main" gutterBottom>
              Important Note:
            </Typography>
            <Typography variant="body2">
              Importing data will overwrite any existing items with the same IDs. Make sure to export your current data before importing if you want to preserve it.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>Additional Help</Typography>
          <Typography variant="body2">
            For further assistance or to report issues, please contact the system administrator or visit the project repository.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserManualModal;