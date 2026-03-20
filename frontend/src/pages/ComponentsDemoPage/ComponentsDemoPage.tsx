import { type ReactElement,useState } from 'react';
import { LuCheck, LuDownload, LuHeart, LuTrash2, LuX } from 'react-icons/lu';

import { Badge, Button, Card, Input, Modal, Spinner, Textarea, ToastContainer } from '@components';
import { useDocumentTitle, useToast } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import styles from './ComponentsDemoPage.module.scss';

/**
 * Components Demo Page
 *
 * A comprehensive demonstration of all components in the project.
 * Showcases design patterns, usage examples, and interactive features.
 */
export const ComponentsDemoPage = (): ReactElement => {
  useDocumentTitle(routeMetadata[PATHS.COMPONENTS_DEMO].title);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, addToast, dismissToast } = useToast();

  const handleLoadingClick = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }));

    // Simulate async operation
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }));
    }, 2000);
  };

  const buttonVariants = [
    { name: 'Primary', variant: 'primary' as const },
    { name: 'Secondary', variant: 'secondary' as const },
    { name: 'Tertiary', variant: 'tertiary' as const },
    { name: 'Outline', variant: 'outline' as const },
    { name: 'Ghost', variant: 'ghost' as const },
    { name: 'Danger', variant: 'danger' as const },
    { name: 'Success', variant: 'success' as const },
  ];

  const buttonSizes = [
    { name: 'Small', size: 'sm' as const },
    { name: 'Medium', size: 'md' as const },
    { name: 'Large', size: 'lg' as const },
  ];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1>Components Library</h1>
        <p>A comprehensive showcase of all reusable components in the project.</p>
      </header>

      <section className={styles.content}>
        {/* Button Component Section */}
        <section className={styles.section}>
          <h2>Button Component</h2>
          <p>
            A comprehensive, reusable button component with multiple variants, sizes, and states.
          </p>

          {/* Variants Section */}
          <div className={styles.subsection}>
            <h3>Button Variants</h3>
            <p>Different visual styles for different use cases.</p>

            <div className={styles.buttonGrid}>
              {buttonVariants.map(({ name, variant }) => (
                <div key={variant} className={styles.buttonExample}>
                  <h4>{name}</h4>
                  <Button variant={variant}>{name} Button</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes Section */}
          <div className={styles.subsection}>
            <h3>Button Sizes</h3>
            <p>Different sizes for different contexts and hierarchies.</p>

            <div className={styles.buttonGrid}>
              {buttonSizes.map(({ name, size }) => (
                <div key={size} className={styles.buttonExample}>
                  <h4>{name}</h4>
                  <Button variant="primary" size={size}>
                    {name} Button
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Icons Section */}
          <div className={styles.subsection}>
            <h3>Buttons with Icons</h3>
            <p>Buttons can include icons for better visual communication.</p>

            <div className={styles.buttonGrid}>
              <div className={styles.buttonExample}>
                <h4>Left Icon (Default)</h4>
                <Button variant="primary" icon={<LuDownload size={18} />}>
                  Download
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Right Icon</h4>
                <Button variant="outline" icon={<LuHeart size={18} />} iconPosition="right">
                  Like
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Danger with Icon</h4>
                <Button variant="danger" icon={<LuTrash2 size={18} />}>
                  Delete
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Icon Only</h4>
                <Button variant="ghost" icon={<LuCheck size={18} />}>
                  <span className="sr-only">Confirm</span>
                </Button>
              </div>
            </div>
          </div>

          {/* States Section */}
          <div className={styles.subsection}>
            <h3>Button States</h3>
            <p>Different states for different interactions.</p>

            <div className={styles.buttonGrid}>
              <div className={styles.buttonExample}>
                <h4>Default</h4>
                <Button variant="primary">Default Button</Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Disabled</h4>
                <Button variant="primary" disabled>
                  Disabled Button
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Loading</h4>
                <Button
                  variant="primary"
                  loading={loadingStates['loading-demo'] ?? false}
                  onClick={() => handleLoadingClick('loading-demo')}
                >
                  {loadingStates['loading-demo'] ? 'Loading...' : 'Click to Load'}
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Loading with Icon</h4>
                <Button
                  variant="outline"
                  loading={loadingStates['loading-icon'] ?? false}
                  onClick={() => handleLoadingClick('loading-icon')}
                >
                  {loadingStates['loading-icon'] ? 'Processing...' : 'Process Data'}
                </Button>
              </div>
            </div>
          </div>

          {/* Full Width Section */}
          <div className={styles.subsection}>
            <h3>Full Width Buttons</h3>
            <p>Buttons that span the full width of their container.</p>

            <div className={styles.fullWidthGrid}>
              <div className={styles.buttonExample}>
                <h4>Primary Full Width</h4>
                <Button variant="primary" fullWidth>
                  Full Width Primary Button
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Outline Full Width</h4>
                <Button variant="outline" fullWidth>
                  Full Width Outline Button
                </Button>
              </div>
            </div>
          </div>

          {/* Interactive Examples */}
          <div className={styles.subsection}>
            <h3>Interactive Examples</h3>
            <p>Real-world examples of button usage.</p>

            <div className={styles.interactiveGrid}>
              <div className={styles.buttonExample}>
                <h4>Form Submit</h4>
                <Button
                  variant="success"
                  icon={<LuCheck size={18} />}
                  loading={loadingStates['form-submit'] ?? false}
                  onClick={() => handleLoadingClick('form-submit')}
                >
                  {loadingStates['form-submit'] ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Cancel Action</h4>
                <Button variant="ghost" icon={<LuX size={18} />}>
                  Cancel
                </Button>
              </div>

              <div className={styles.buttonExample}>
                <h4>Danger Action</h4>
                <Button
                  variant="danger"
                  icon={<LuTrash2 size={18} />}
                  loading={loadingStates['danger-action'] ?? false}
                  onClick={() => handleLoadingClick('danger-action')}
                >
                  {loadingStates['danger-action'] ? 'Deleting...' : 'Delete Item'}
                </Button>
              </div>
            </div>
          </div>

          {/* Accessibility Section */}
          <div className={styles.subsection}>
            <h3>Accessibility Features</h3>
            <p>The Button component includes comprehensive accessibility features:</p>

            <ul className={styles.accessibilityList}>
              <li>Proper ARIA attributes for disabled and loading states</li>
              <li>Focus-visible outline for keyboard navigation</li>
              <li>Screen reader support for loading states</li>
              <li>Proper button semantics and roles</li>
              <li>Keyboard interaction support</li>
              <li>High contrast color schemes</li>
            </ul>
          </div>
        </section>

        {/* Input Component Section */}
        <section className={styles.section}>
          <h2>Input Component</h2>
          <p>A labelled text input with optional error and helper text.</p>

          <div className={styles.subsection}>
            <h3>Basic inputs</h3>
            <div className={styles.buttonGrid}>
              <div className={styles.buttonExample}>
                <h4>Default</h4>
                <Input label="Email address" placeholder="you@example.com" />
              </div>
              <div className={styles.buttonExample}>
                <h4>With helper text</h4>
                <Input
                  label="Password"
                  type="password"
                  helperText="Must be at least 8 characters"
                />
              </div>
              <div className={styles.buttonExample}>
                <h4>With error</h4>
                <Input label="Username" error="Username is already taken" value="john_doe" readOnly />
              </div>
              <div className={styles.buttonExample}>
                <h4>Disabled</h4>
                <Input label="Locked field" disabled value="Read only" readOnly />
              </div>
            </div>
          </div>

          <div className={styles.subsection}>
            <h3>Sizes</h3>
            <div className={styles.buttonGrid}>
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <div key={sz} className={styles.buttonExample}>
                  <h4>Size {sz}</h4>
                  <Input label={`Size ${sz}`} size={sz} placeholder={sz} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.subsection}>
            <h3>Controlled</h3>
            <Input
              label="Type something"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText={`${inputValue.length} characters`}
            />
          </div>
        </section>

        {/* Textarea Component Section */}
        <section className={styles.section}>
          <h2>Textarea Component</h2>
          <p>A multi-line text area with the same label / error / helper-text system as Input.</p>

          <div className={styles.buttonGrid}>
            <div className={styles.buttonExample}>
              <h4>Default</h4>
              <Textarea label="Description" placeholder="Enter a description…" />
            </div>
            <div className={styles.buttonExample}>
              <h4>With error</h4>
              <Textarea label="Bio" error="Must be at least 20 characters" />
            </div>
            <div className={styles.buttonExample}>
              <h4>Controlled</h4>
              <Textarea
                label="Notes"
                value={textareaValue}
                rows={5}
                onChange={(e) => setTextareaValue(e.target.value)}
                helperText={`${textareaValue.length} / 500`}
              />
            </div>
          </div>
        </section>

        {/* Badge Component Section */}
        <section className={styles.section}>
          <h2>Badge Component</h2>
          <p>Small pill-shaped status indicators.</p>

          <div className={styles.subsection}>
            <h3>Variants</h3>
            <div className={styles.buttonGrid}>
              {(['success', 'warning', 'error', 'neutral', 'info'] as const).map((v) => (
                <div key={v} className={styles.buttonExample}>
                  <h4 style={{ textTransform: 'capitalize' }}>{v}</h4>
                  <Badge variant={v} style={{ textTransform: 'capitalize' }}>
                    {v}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.subsection}>
            <h3>Sizes</h3>
            <div className={styles.buttonGrid}>
              <div className={styles.buttonExample}>
                <h4>Small</h4>
                <Badge size="sm" variant="info">Small badge</Badge>
              </div>
              <div className={styles.buttonExample}>
                <h4>Medium (default)</h4>
                <Badge size="md" variant="success">Medium badge</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Spinner Component Section */}
        <section className={styles.section}>
          <h2>Spinner Component</h2>
          <p>An animated loading indicator that respects reduced-motion preferences.</p>

          <div className={styles.buttonGrid}>
            {(['sm', 'md', 'lg'] as const).map((sz) => (
              <div key={sz} className={styles.buttonExample}>
                <h4>Size {sz}</h4>
                <Spinner size={sz} label={`Loading (${sz})…`} />
              </div>
            ))}
          </div>
        </section>

        {/* Card Component Section */}
        <section className={styles.section}>
          <h2>Card Component</h2>
          <p>A surface element that groups related content with configurable padding and shadow.</p>

          <div className={styles.subsection}>
            <h3>Padding variants</h3>
            <div className={styles.buttonGrid}>
              {(['none', 'sm', 'md', 'lg'] as const).map((p) => (
                <div key={p} className={styles.buttonExample}>
                  <h4>padding="{p}"</h4>
                  <Card padding={p}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Card content</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.subsection}>
            <h3>Shadow variants</h3>
            <div className={styles.buttonGrid}>
              {(['none', 'sm', 'md', 'lg'] as const).map((sh) => (
                <div key={sh} className={styles.buttonExample}>
                  <h4>shadow="{sh}"</h4>
                  <Card shadow={sh} padding="md">
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Card content</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Modal Component Section */}
        <section className={styles.section}>
          <h2>Modal Component</h2>
          <p>
            A native <code>&lt;dialog&gt;</code>-based modal with title, backdrop dismiss, and
            keyboard close support.
          </p>

          <div className={styles.buttonGrid}>
            <div className={styles.buttonExample}>
              <h4>Open modal</h4>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>
            </div>
          </div>

          <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Example Dialog">
            <p>This is a modal dialog. Click outside or press the close button to dismiss.</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </Modal>
        </section>

        {/* Toast Component Section */}
        <section className={styles.section}>
          <h2>Toast / useToast</h2>
          <p>
            Individual notification strips driven by the{' '}
            <code>useToast()</code> hook from{' '}
            <code>tast-hooks</code>.
          </p>

          <div className={styles.buttonGrid}>
            {(['info', 'success', 'warning', 'error'] as const).map((v) => (
              <div key={v} className={styles.buttonExample}>
                <h4 style={{ textTransform: 'capitalize' }}>{v}</h4>
                <Button
                  variant={v === 'info' ? 'primary' : v === 'success' ? 'success' : v === 'error' ? 'danger' : 'outline'}
                  onClick={() => addToast(`This is a ${v} message`, v, 0)}
                >
                  Add {v}
                </Button>
              </div>
            ))}
          </div>

          {toasts.length > 0 && (
            <div className={styles.subsection} style={{ marginTop: '1rem' }}>
              <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            </div>
          )}
        </section>
      </section>
    </div>
  );
};
