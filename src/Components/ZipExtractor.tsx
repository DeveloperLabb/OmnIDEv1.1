import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  CircularProgress,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import { extractZip } from '../services/api';

const ZipExtractor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<string[]>([]);
  const [extractPath, setExtractPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setSelectedFile(null);
        setError('Please select a valid ZIP file');
      }
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError('Please select a ZIP file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setExtractedFiles([]);

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const response = await extractZip(formData);
      
      if (response.success) {
        setExtractedFiles(response.files);
        setExtractPath(response.extract_path);
        setSuccess(`ZIP extracted successfully to: ${response.extract_path}`);
      } else {
        setError('Failed to extract ZIP file');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>ZIP File Extractor</Typography>
        
        <Box sx={{ 
          border: '2px dashed #ccc', 
          borderRadius: 2, 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 2
        }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedFile ? `Selected file: ${selectedFile.name}` : 'Drag and drop a ZIP file here, or click to browse'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleBrowseClick}
            startIcon={<CloudUploadIcon />}
          >
            Browse Files
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".zip"
            style={{ display: 'none' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleExtract}
            disabled={!selectedFile || isLoading}
            sx={{ minWidth: 150 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Extract ZIP'}
          </Button>
        </Box>
        
        <Collapse in={!!error || !!success}>
          <Box sx={{ mb: 2 }}>
            {error && (
              <Alert 
                severity="error"
                action={
                  <IconButton size="small" onClick={() => setError(null)}>
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert 
                severity="success"
                action={
                  <IconButton size="small" onClick={() => setSuccess(null)}>
                    <CloseIcon fontSize="inherit" />
                  </IconButton>
                }
              >
                {success}
              </Alert>
            )}
          </Box>
        </Collapse>
        
        {extractedFiles.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Extracted Files:</Typography>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {extractedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {file.endsWith('/') ? <FolderIcon /> : <InsertDriveFileIcon />}
                    </ListItemIcon>
                    <ListItemText primary={file} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ZipExtractor;