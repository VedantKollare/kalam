import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LuxuryLandingPage from './LuxuryLandingPage';

describe('LuxuryLandingPage', () => {
  it('renders the hero, featured categories, and product CTA', () => {
    render(<LuxuryLandingPage />);

    expect(screen.getAllByText(/om creations/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /designer blouses/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /quick add/i }).length).toBeGreaterThan(0);
  });
});
