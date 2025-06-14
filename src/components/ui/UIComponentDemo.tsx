import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter,
  Typography,
  LoadingSpinner,
  Alert,
  Container,
  Flex,
  Grid
} from './index';

export const UIComponentDemo: React.FC = () => {
  const [showAlert, setShowAlert] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Container maxWidth="xl" padding="lg">
      <div className="space-y-8">
        <Typography variant="h1" className="text-center">
          UI Component Library Demo
        </Typography>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <Typography variant="h3">Buttons</Typography>
          </CardHeader>
          <CardContent>
            <Flex gap="md" wrap>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </Flex>
            
            <div className="mt-4">
              <Typography variant="h6" className="mb-2">Button Sizes</Typography>
              <Flex gap="md" align="center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Flex>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card>
          <CardHeader>
            <Typography variant="h3">Inputs</Typography>
          </CardHeader>
          <CardContent>
            <Grid cols={2} gap="lg">
              <Input 
                label="Basic Input" 
                placeholder="Enter text..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input 
                label="Input with Helper Text" 
                helperText="This is helper text"
                placeholder="Enter text..."
              />
              <Input 
                label="Input with Error" 
                error="This field is required"
                placeholder="Enter text..."
              />
              <Input 
                label="Disabled Input" 
                disabled
                placeholder="Disabled input"
              />
            </Grid>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <Typography variant="h3">Typography</Typography>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Typography variant="h1">Heading 1</Typography>
              <Typography variant="h2">Heading 2</Typography>
              <Typography variant="h3">Heading 3</Typography>
              <Typography variant="h4">Heading 4</Typography>
              <Typography variant="h5">Heading 5</Typography>
              <Typography variant="h6">Heading 6</Typography>
              <Typography variant="body1">Body 1 - Regular paragraph text with comfortable line spacing for easy reading.</Typography>
              <Typography variant="body2">Body 2 - Smaller paragraph text for secondary content.</Typography>
              <Typography variant="caption">Caption - Small text for captions and metadata.</Typography>
              <Typography variant="overline">OVERLINE - Uppercase text for labels</Typography>
            </div>
            
            <div className="mt-6">
              <Typography variant="h6" className="mb-2">Colors</Typography>
              <Flex direction="col" gap="sm">
                <Typography color="primary">Primary color text</Typography>
                <Typography color="secondary">Secondary color text</Typography>
                <Typography color="success">Success color text</Typography>
                <Typography color="warning">Warning color text</Typography>
                <Typography color="error">Error color text</Typography>
                <Typography color="muted">Muted color text</Typography>
              </Flex>
            </div>
          </CardContent>
        </Card>

        {/* Loading Spinner Section */}
        <Card>
          <CardHeader>
            <Typography variant="h3">Loading Spinners</Typography>
          </CardHeader>
          <CardContent>
            <Flex gap="lg" align="center">
              <div className="text-center">
                <LoadingSpinner size="sm" />
                <Typography variant="caption" className="mt-2 block">Small</Typography>
              </div>
              <div className="text-center">
                <LoadingSpinner size="md" />
                <Typography variant="caption" className="mt-2 block">Medium</Typography>
              </div>
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <Typography variant="caption" className="mt-2 block">Large</Typography>
              </div>
            </Flex>
            
            <div className="mt-6">
              <Button onClick={handleLoadingDemo} disabled={loading}>
                {loading ? 'Loading...' : 'Test Loading State'}
              </Button>
              {loading && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md flex items-center gap-3">
                  <LoadingSpinner size="sm" />
                  <Typography variant="body2">Processing your request...</Typography>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <Typography variant="h3">Alerts</Typography>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="info" title="Information">
                This is an informational alert with additional details.
              </Alert>
              <Alert variant="success" title="Success">
                Your action was completed successfully!
              </Alert>
              <Alert variant="warning" title="Warning">
                Please review your input before proceeding.
              </Alert>
              <Alert variant="error" title="Error">
                There was an error processing your request.
              </Alert>
              
              {showAlert && (
                <Alert 
                  variant="info" 
                  title="Dismissible Alert"
                  onClose={() => setShowAlert(false)}
                >
                  This alert can be dismissed by clicking the X button.
                </Alert>
              )}
              
              {!showAlert && (
                <Button variant="outline" onClick={() => setShowAlert(true)}>
                  Show Dismissible Alert
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Layout Section */}
        <Card>
          <CardHeader>
            <Typography variant="h3">Layout Components</Typography>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Typography variant="h6" className="mb-2">Flex Layout</Typography>
                <Flex gap="md" className="p-4 bg-gray-50 rounded-md">
                  <div className="p-3 bg-blue-100 rounded">Item 1</div>
                  <div className="p-3 bg-blue-100 rounded">Item 2</div>
                  <div className="p-3 bg-blue-100 rounded">Item 3</div>
                </Flex>
              </div>
              
              <div>
                <Typography variant="h6" className="mb-2">Grid Layout</Typography>
                <Grid cols={3} gap="md" className="p-4 bg-gray-50 rounded-md">
                  <div className="p-3 bg-green-100 rounded text-center">Grid 1</div>
                  <div className="p-3 bg-green-100 rounded text-center">Grid 2</div>
                  <div className="p-3 bg-green-100 rounded text-center">Grid 3</div>
                  <div className="p-3 bg-green-100 rounded text-center">Grid 4</div>
                  <div className="p-3 bg-green-100 rounded text-center">Grid 5</div>
                  <div className="p-3 bg-green-100 rounded text-center">Grid 6</div>
                </Grid>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Variants Section */}
        <div>
          <Typography variant="h3" className="mb-4">Card Variants</Typography>
          <Grid cols={3} gap="lg">
            <Card variant="default">
              <CardHeader>
                <Typography variant="h6">Default Card</Typography>
              </CardHeader>
              <CardContent>
                <Typography variant="body2">
                  This is a default card with standard styling.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
            
            <Card variant="outlined">
              <CardHeader>
                <Typography variant="h6">Outlined Card</Typography>
              </CardHeader>
              <CardContent>
                <Typography variant="body2">
                  This is an outlined card with a thicker border.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">Action</Button>
              </CardFooter>
            </Card>
            
            <Card variant="elevated">
              <CardHeader>
                <Typography variant="h6">Elevated Card</Typography>
              </CardHeader>
              <CardContent>
                <Typography variant="body2">
                  This is an elevated card with a shadow effect.
                </Typography>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">Action</Button>
              </CardFooter>
            </Card>
          </Grid>
        </div>
      </div>
    </Container>
  );
};