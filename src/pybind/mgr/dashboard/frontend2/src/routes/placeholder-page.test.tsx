import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlaceholderPage } from '@/routes/placeholder-page';

describe('PlaceholderPage', () => {
  it('renders title', () => {
    render(<PlaceholderPage title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('renders noData message', () => {
    render(<PlaceholderPage title="Test" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });
});
