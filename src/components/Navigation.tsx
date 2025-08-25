import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
            Beyond Big-O
          </Link>
          
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  isActive('/') ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/blogs" 
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  isActive('/blogs') ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                Blogs
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                  isActive('/about') ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                About
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}