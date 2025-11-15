import React from 'react';

export function Footer() {
  return (
    <footer className="mt-24 py-12 border-t border-white/10">
      <div className="max-w-[1440px] mx-auto px-20">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1D9BF0] to-[#22D3EE] flex items-center justify-center">
              <span className="text-white text-sm">ON</span>
            </div>
            <span className="text-[#9CA3AF]">Our Name</span>
          </div>

          {/* Footer Links */}
          <div className="flex items-center gap-8">
            <a href="#" className="text-[#9CA3AF] hover:text-[#1D9BF0] transition-colors duration-200">
              Terms
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-[#1D9BF0] transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-[#9CA3AF] hover:text-[#1D9BF0] transition-colors duration-200">
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet - Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          footer > div {
            padding-left: 72px;
            padding-right: 72px;
          }
        }
        @media (max-width: 768px) {
          footer > div {
            padding-left: 16px;
            padding-right: 16px;
          }
          footer > div > div {
            flex-direction: column;
            gap: 24px;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}