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

import CodeEditor from './CodeEditor';
import ZipExtractor from './ZipExtractor';

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
          <Typography variant="body1">
            Assignments tab content will go here.
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Dashboard; // Make sure this line is present