import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Alert
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CodeIcon from '@mui/icons-material/Code';
import CodeEditor from './CodeEditor';

interface ExtractedCodeViewerProps {
  extractedFiles: string[];
  extractPath: string;
}

interface FileContent {
  name: string;
  content: string;
  language: string;
}

const ExtractedCodeViewer: React.FC<ExtractedCodeViewerProps> = ({ extractedFiles, extractPath }) => {
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to determine language from file extension
  const getLanguageFromExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c', // C header files
      'hpp': 'cpp', // C++ header files
      'cs': 'csharp',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    
    return extensionMap[extension] || 'text';
  };

  // Function to check if a file is a code file
  const isCodeFile = (filename: string): boolean => {
    const codeExtensions = ['js', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'html', 'css', 'json', 'txt'];
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return codeExtensions.includes(extension);
  };

  // Function to read file content
  const readFileContent = async (filename: string) => {
    try {
      setError(null);
      
      // We need to construct the full path from the extractPath and filename
      const response = await fetch(`/api/code/file?path=${encodeURIComponent(`${extractPath}/${filename}`)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }
      
      const data = await response.text();
      
      setSelectedFile({
        name: filename,
        content: data,
        language: getLanguageFromExtension(filename)
      });
    } catch (error) {
      setError(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error reading file:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* File list sidebar */}
      <Paper 
        elevation={2} 
        sx={{ 
          width: '250px', 
          overflow: 'auto',
          height: '100%',
          maxHeight: '600px',
          mr: 2
        }}
      >
        <Typography variant="h6" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          Extracted Files
        </Typography>
        
        <List dense>
          {extractedFiles.filter(isCodeFile).map((file, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton onClick={() => readFileContent(file)}>
                <ListItemIcon>
                  {file.endsWith('.py') || file.endsWith('.js') || file.endsWith('.java') || 
                   file.endsWith('.c') || file.endsWith('.cpp') ? 
                    <CodeIcon /> : <InsertDriveFileIcon />}
                </ListItemIcon>
                <ListItemText primary={file} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
      
      {/* Code editor area */}
      <Box sx={{ flexGrow: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {selectedFile ? (
          <CodeEditor 
            initialCode={selectedFile.content} 
            initialLanguage={selectedFile.language}
            filename={selectedFile.name}
          />
        ) : (
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '400px'
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Select a file from the list to view and run its code
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ExtractedCodeViewer;