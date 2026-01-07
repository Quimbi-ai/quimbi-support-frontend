import { Outlet, NavLink } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-bold text-lg">Quimbi</div>
          <div className="flex gap-4">
            <NavLink
              to="/demo"
              className={({ isActive }) =>
                `text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Demo
            </NavLink>
            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                `text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Inbox
            </NavLink>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
