"use client";
import { useMemo } from 'react';

import { useTheme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

type ResponsiveType = 'PC' | 'Tablet' | 'Phone';

export function useResponsive(responsiveType: ResponsiveType): boolean {
  const theme = useTheme();

  const mediaQuery = useMemo(() => {
    switch (responsiveType) {
      case 'PC':
        return theme.breakpoints.up('lg');
      case 'Tablet':
        return theme.breakpoints.between('sm', 'lg') || (theme.breakpoints.up('sm') && theme.breakpoints.down('lg'));
      case 'Phone':
        return theme.breakpoints.down('sm');
      default:
        return theme.breakpoints.up('lg');
    }
  }, [responsiveType, theme.breakpoints]);

  return useMediaQuery(mediaQuery);
}
