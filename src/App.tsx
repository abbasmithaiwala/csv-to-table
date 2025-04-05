import { useState } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Index } from './pages/Index';
import Upload from './pages/Upload';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
    typography: {
      fontFamily: '"Outfit", system-ui, Avenir, Helvetica, Arial, sans-serif',
    },
  });

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" color="default">
            <Toolbar>
              <Typography 
                variant="h6" 
                component={Link} 
                to="/" 
                sx={{ 
                  flexGrow: 1, 
                  textDecoration: 'none', 
                  color: 'inherit' 
                }}
              >
                Data Table
              </Typography>
              <Button 
                component={Link} 
                to="/upload" 
                startIcon={<UploadFileIcon />}
                sx={{ mr: 2 }}
              >
                Upload
              </Button>
              <IconButton 
                color="inherit" 
                onClick={() => setDarkMode(!darkMode)}
                sx={{ ml: 1 }}
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Toolbar>
          </AppBar>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </Box>
      </ThemeProvider>
    </Router>
  );
}

export default App;
