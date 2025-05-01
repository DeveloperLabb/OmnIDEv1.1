import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-monokai';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Paper, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BuildIcon from '@mui/icons-material/Build';
import { compileCode, runCode } from '../services/api';

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  filename?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialCode = '// Write your code here',
  initialLanguage = 'javascript',
  filename = ''
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [input, setInput] = useState('');
  const [args, setArgs] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Update code and language when props change
  useEffect(() => {
    setCode(initialCode);
    setLanguage(initialLanguage);
    setOutput('');
    setStatusMessage('');
  }, [initialCode, initialLanguage, filename]);

  const getAceMode = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'javascript';
      case 'python':
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'c':
      case 'cpp':
      case 'c++':
        return 'c_cpp';
      default:
        return 'javascript';
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleLanguageChange = (event: any) => {
    setLanguage(event.target.value);
  };

  const handleCompile = async () => {
    setIsLoading(true);
    setStatusMessage('Compiling...');
    try {
      const response = await compileCode({
        code,
        language,
        args: args.trim() || undefined
      });
      
      if (response.success) {
        setStatusMessage('Compilation successful');
        setOutput('Compilation successful');
      } else {
        setStatusMessage('Compilation failed');
        setOutput(response.message || 'Compilation failed with unknown error');
      }
    } catch (error) {
      setStatusMessage('Error');
      setOutput(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRun = async () => {
    setIsLoading(true);
    setStatusMessage('Running...');
    try {
      const response = await runCode({
        code,
        language,
        input_data: input.trim() || undefined,
        args: args.trim() || undefined
      });
      
      setStatusMessage(response.success ? 'Run successful' : 'Run failed');
      setOutput(response.output || 'No output');
    } catch (error) {
      setStatusMessage('Error');
      setOutput(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%'}}>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {filename ? `Editing: ${filename}` : 'Code Editor'}
          </Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={language}
              label="Language"
              onChange={handleLanguageChange}
            >
              <MenuItem value="javascript">JavaScript</MenuItem>
              <MenuItem value="python">Python</MenuItem>
              <MenuItem value="java">Java</MenuItem>
              <MenuItem value="cpp">C++</MenuItem>
              <MenuItem value="c">C</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <AceEditor
          mode={getAceMode(language)}
          theme="monokai"
          onChange={handleCodeChange}
          value={code}
          name="code-editor"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
          }}
          width="100%"
          height="400px"
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <TextField
            label="Arguments (optional)"
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ width: '48%' }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<BuildIcon />}
              onClick={handleCompile}
              disabled={isLoading}
              color="primary"
            >
              Compile
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleRun}
              disabled={isLoading}
              color="success"
            >
              Run
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Input</Typography>
        <TextField
          label="Standard Input (optional)"
          multiline
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          variant="outlined"
          fullWidth
        />
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Output</Typography>
          <Typography variant="body2" color={
            statusMessage.includes('successful') ? 'success.main' : 
            statusMessage.includes('failed') || statusMessage.includes('Error') ? 'error.main' : 
            'info.main'
          }>
            {statusMessage}
          </Typography>
        </Box>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5', 
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '200px'
          }}
        >
          {output || 'No output yet. Run your code to see results.'}
        </Paper>
      </Paper>
    </Box>
  );
};

export default CodeEditor;