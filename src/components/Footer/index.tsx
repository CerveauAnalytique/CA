import type { Footer } from '@/payload-types'
import { FooterMenu } from '@/components/Footer/menu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React, { Suspense } from 'react'

export async function Footer() {
  const footer: Footer = await getCachedGlobal('footer', 1)()
  const menu = footer.navItems || []

  return (
    <footer>
      <div className="footer-top">
        {/* Brand col */}
        <div className="footer-brand">
          <Link href="/" className="footer-brand-logo block">
            Cerveau Analytique
          </Link>
          <div className="footer-brand-desc">
            The analytical intelligence layer for teams building the future.
          </div>
          <div className="footer-socials">
            {/* X / Twitter */}
            <a href="https://x.com" target="_blank" rel="noreferrer" className="footer-social" title="X">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 1.5l4.5 5.5L1 11.5h1.2l3.9-4.1 3.1 4.1H12L7.3 5.7 11.5 1.5h-1.2L6.7 5.3 3.8 1.5H1z" fill="currentColor"/>
              </svg>
            </a>
            {/* GitHub */}
            <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social" title="GitHub">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.5 0a6.5 6.5 0 0 0-2.055 12.668c.325.06.444-.141.444-.313 0-.154-.006-.563-.009-1.107-1.807.393-2.189-.872-2.189-.872-.296-.751-.722-0.951-.722-.951-.59-.403.045-.395.045-.395.652.046.995.67.995.67.579.992 1.52.706 1.89.539.059-.42.226-.706.411-.868-1.442-.164-2.957-.721-2.957-3.21 0-.709.253-1.288.669-1.742-.067-.165-.29-.824.064-1.717 0 0 .546-.175 1.788.667a6.22 6.22 0 0 1 1.629-.22c.553.003 1.109.075 1.629.22 1.241-.842 1.786-.667 1.786-.667.355.893.132 1.552.065 1.717.417.454.668 1.033.668 1.742 0 2.496-1.517 3.044-2.962 3.205.233.2.44.598.44 1.205 0 .87-.008 1.571-.008 1.785 0 .174.117.377.447.313A6.5 6.5 0 0 0 6.5 0z" fill="currentColor"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social" title="LinkedIn">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 5.5v4M3.5 3.5v.5M5.5 9.5V7a1.5 1.5 0 0 1 3 0v2.5M5.5 5.5v4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Product & Store Column */}
        <div>
          <div className="footer-col-title">Product & Store</div>
          <div className="footer-col-links">
            <Link href="/shop" className="footer-col-link">Products Shop</Link>
            <Link href="/checkout" className="footer-col-link">View Cart & Checkout</Link>
            <Link href="/research" className="footer-col-link">Research Engine</Link>
            <Link href="/api" className="footer-col-link">API Access</Link>
            <Link href="/account" className="footer-col-link">My Account</Link>
          </div>
        </div>

        {/* Developers Column */}
        <div>
          <div className="footer-col-title">Developers</div>
          <div className="footer-col-links">
            <Link href="/docs" className="footer-col-link">Documentation</Link>
            <Link href="/docs/api" className="footer-col-link">API Reference</Link>
            <Link href="/sdks" className="footer-col-link">SDKs</Link>
            <Link href="/status" className="footer-col-link">System Status</Link>
            <Link href="/community" className="footer-col-link">Community</Link>
          </div>
        </div>

        {/* Company & Payload CMS Nav Items Column */}
        <div>
          <div className="footer-col-title">Company</div>
          {menu.length > 0 ? (
            <Suspense fallback={null}>
              <FooterMenu menu={menu} />
            </Suspense>
          ) : (
            <div className="footer-col-links">
              <Link href="/about" className="footer-col-link">About Us</Link>
              <Link href="/blog" className="footer-col-link">Blog & Insights</Link>
              <Link href="/careers" className="footer-col-link">Careers</Link>
              <Link href="/press" className="footer-col-link">Press</Link>
              <Link href="/contact" className="footer-col-link">Contact</Link>
            </div>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-copy">© 2026 Cerveau Analytique, Inc. All rights reserved.</span>

        <div className="footer-status">
          <div className="status-dot"></div>
          All systems operational
        </div>

        <div className="footer-bottom-links">
          <Link href="/privacy" className="footer-bottom-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-bottom-link">Terms of Service</Link>
          <Link href="/security" className="footer-bottom-link">Security</Link>
          <Link href="/cookies" className="footer-bottom-link">Cookies</Link>
        </div>
      </div>
    </footer>
  )
}
