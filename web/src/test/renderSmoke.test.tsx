import { render, screen } from '@testing-library/react';
import { App } from '../App';

test('renders GymChall shell', () => {
  render(<App />);

  expect(screen.getByText('GymChall')).toBeInTheDocument();
});
