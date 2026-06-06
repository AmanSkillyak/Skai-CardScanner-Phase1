import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProcessingSteps from './ProcessingSteps';
import { SCAN_STATUS } from '../constants';

describe('ProcessingSteps', () => {
  it('renders all current steps', () => {
    render(<ProcessingSteps status={SCAN_STATUS.processing} />);

    expect(screen.getByText('Uploading')).toBeInTheDocument();
    expect(screen.getByText('OCR Processing')).toBeInTheDocument();
    expect(screen.getByText('Extracting Fields')).toBeInTheDocument();
    expect(screen.getByText('Detecting Category')).toBeInTheDocument();
  });
});
