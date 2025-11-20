import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Building2, LogOut, User, LayoutDashboard, Briefcase, Users, FileText } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2" data-testid="logo-link">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl">LA Investment</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100" data-testid="nav-dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/deals" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100" data-testid="nav-deals">
                <Briefcase className="h-4 w-4" />
                <span>Deals</span>
              </Link>
              <Link to="/syndicates" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100" data-testid="nav-syndicates">
                <Users className="h-4 w-4" />
                <span>Syndicates</span>
              </Link>
              <Link to="/portfolio" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100" data-testid="nav-portfolio">
                <FileText className="h-4 w-4" />
                <span>Portfolio</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100" data-testid="nav-admin">
                  <User className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/profile" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900" data-testid="nav-profile">
              <User className="h-5 w-5" />
              <span className="hidden md:inline">{user?.full_name}</span>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
