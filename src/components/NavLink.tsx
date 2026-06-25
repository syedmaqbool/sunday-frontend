import type { NavLinkProps } from 'react-router-dom';
import { forwardRef } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utilities';

interface NavLinkCompatProps extends Omit<NavLinkProps, 'className'> {
  activeClassName?: string;
  className?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ activeClassName, className, pendingClassName, to, ...props }, reference) => {
    return (
      <RouterNavLink
        ref={reference}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            className,
            isActive && activeClassName,
            isPending && pendingClassName,
          )}
        {...props}
      />
    );
  },
);

NavLink.displayName = 'NavLink';

export { NavLink };
