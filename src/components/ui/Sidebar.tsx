import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Phone, Upload, BarChart3 } from 'lucide-react';

export function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/campaigns', icon: Phone, label: 'Campaigns' },
    { to: '/upload', icon: Upload, label: 'Upload CSV' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col"
      style={{
        width: '220px',
        backgroundColor: '#111318',
        borderRight: '1px solid #242830',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 h-16"
        style={{ borderBottom: '1px solid #242830' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#00E5A0' }}
        >
          <Phone className="w-4 h-4 text-black" />
        </div>
        <span
          className="font-bold text-lg tracking-tight"
          style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
        >
          CollectIQ
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-100 ${
                isActive ? 'text-[#E8EAF0]' : 'text-[#8A8F9E] hover:text-[#E8EAF0] hover:bg-[#1A1E26]'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    backgroundColor: '#1A1E26',
                    borderLeft: '2px solid #00E5A0',
                    color: '#E8EAF0',
                    fontFamily: "'DM Sans', sans-serif",
                  }
                : {}
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className="w-4 h-4"
                  style={{
                    color: isActive ? '#00E5A0' : '#8A8F9E',
                  }}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid #242830' }}
      >
        <div className="flex items-center gap-3 px-3 py-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ backgroundColor: '#1A1E26', color: '#00E5A0' }}
          >
            A
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium" style={{ color: '#E8EAF0' }}>
              Admin User
            </span>
            <span className="text-[11px]" style={{ color: '#4E5464' }}>
              Operations
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
