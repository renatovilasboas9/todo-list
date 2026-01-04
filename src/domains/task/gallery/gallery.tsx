import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {
    Container,
    Typography,
    Box,
    Paper,
    Divider,
} from '@mui/material'

// Import gallery sections
import { TaskInputGallery } from './components/TaskInputGallery'
import { TaskItemGallery } from './components/TaskItemGallery'
import { TaskListGallery } from './components/TaskListGallery'
import { TaskManagerAppGallery } from './components/TaskManagerAppGallery'

/**
 * Material UI Theme for the Gallery
 * This theme will be used across all prototypes to ensure consistency
 */
const galleryTheme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 6,
                },
            },
        },
    },
})

/**
 * Gallery Section Component
 * Wraps each component gallery with consistent styling
 */
interface GallerySectionProps {
    title: string
    description: string
    children: React.ReactNode
}

function GallerySection({ title, description, children }: GallerySectionProps) {
    return (
        <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom color="primary">
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                {description}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {children}
        </Paper>
    )
}
/**
 * Main Gallery Application
 * Showcases all UI component prototypes with Material UI
 */
function Gallery() {
    return (
        <ThemeProvider theme={galleryTheme}>
            <CssBaseline />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box textAlign="center" mb={6}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Task Manager UI Gallery
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Component Prototypes & Design Validation
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                        This gallery demonstrates Material UI component prototypes for the task management system.
                        Each section shows different states, interactions, and validation scenarios.
                    </Typography>
                </Box>

                <GallerySection
                    title="TaskInput Component"
                    description="Input field for creating new tasks with validation feedback and MUI styling"
                >
                    <TaskInputGallery />
                </GallerySection>

                <GallerySection
                    title="TaskItem Component"
                    description="Individual task display with completion toggle and delete functionality"
                >
                    <TaskItemGallery />
                </GallerySection>

                <GallerySection
                    title="TaskList Component"
                    description="List container for multiple tasks with empty state and responsive layout"
                >
                    <TaskListGallery />
                </GallerySection>

                <GallerySection
                    title="TaskManagerApp Layout"
                    description="Complete application layout integrating all components with MUI theme"
                >
                    <TaskManagerAppGallery />
                </GallerySection>
            </Container>
        </ThemeProvider>
    )
}

// Render the Gallery
const container = document.getElementById('gallery-root')
if (container) {
    const root = createRoot(container)
    root.render(<Gallery />)
}