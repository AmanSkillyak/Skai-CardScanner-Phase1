import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UploadCard from './UploadCard';

describe('UploadCard', () => {
  it('renders the upload UI', () => {
    render(<UploadCard onFileSelect={vi.fn()} preview="" />);

    expect(screen.getByText('Click or drag to upload')).toBeInTheDocument();
    expect(screen.getByText('JPG, PNG, WebP, PDF — max 10MB')).toBeInTheDocument();
  });
});
