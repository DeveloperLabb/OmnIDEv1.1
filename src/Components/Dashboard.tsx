import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider 
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

import CodeEditor from './CodeEditor';
import ZipExtractor from './ZipExtractor';
import BatchProcessor from './BatchProcessor';
import AssignmentsList from './AssignmentList';
import ScoringReport from './ScoringReport';
import LanguageConfiguration from './LanguageConfiguration';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="IDE tabs"
            variant="fullWidth"
          >
            <Tab icon={<CodeIcon />} label="Code Editor" />
            <Tab icon={<FolderZipIcon />} label="ZIP Extractor" />
            <Tab icon={<FormatListNumberedIcon />} label="Assignments" />
            <Tab icon={<AssignmentIcon />} label="Batch Processor" />
            <Tab icon={<AssessmentIcon />} label="Scoring Report" />
            <Tab icon={<SettingsIcon />} label="Configurations" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" sx={{ mb: 2 }}>Code Editor & Runner</Typography>
          <Divider sx={{ mb: 2 }} />
          <CodeEditor />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" sx={{ mb: 2 }}>ZIP File Extractor</Typography>
          <Divider sx={{ mb: 2 }} />
          <ZipExtractor />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" sx={{ mb: 2 }}>Assignments</Typography>
          <Divider sx={{ mb: 2 }} />
          <AssignmentsList />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" sx={{ mb: 2 }}>Assignment Batch Processor</Typography>
          <Divider sx={{ mb: 2 }} />
          <BatchProcessor />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h5" sx={{ mb: 2 }}>Scoring Reports</Typography>
          <Divider sx={{ mb: 2 }} />
          <ScoringReport />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h5" sx={{ mb: 2 }}>Language Configurations</Typography>
          <Divider sx={{ mb: 2 }} />
          <LanguageConfiguration />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Dashboard;