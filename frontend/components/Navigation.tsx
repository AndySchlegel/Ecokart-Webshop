'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { API_BASE_URL } from '../lib/config';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl: string;
}

export default function Navigation() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { cartItemCount } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (category: string | null) => {
    const target = category ? `/?category=${category}#featured-products` : '/#featured-products';
    setSidebarOpen(false);
    router.push(target);
  };

  const handlePriceFilter = (minPrice: number | null, maxPrice: number | null) => {
    let target = '/#featured-products';
    const params = new URLSearchParams();

    if (minPrice !== null) {
      params.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== null) {
      params.set('maxPrice', maxPrice.toString());
    }

    if (params.toString()) {
      target = `/?${params.toString()}#featured-products`;
    }

    setSidebarOpen(false);
    router.push(target);
  };

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (response.ok) {
          const data = await response.json();
          const products = data.items || [];
          const query = searchQuery.toLowerCase();

          const filtered = products
            .filter((product: Product) => {
              const name = product.name.toLowerCase();
              return name.includes(query);
            })
            .slice(0, 5); // Max 5 suggestions

          setSearchSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}#featured-products`);
      setSearchOpen(false);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (productId: string) => {
    router.push(`/product/${productId}`);
    setSearchOpen(false);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          {/* Left: Hamburger Menu */}
          <button
            type="button"
            className="nav-icon-btn nav-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Center: Logo */}
          <Link href="/" className="nav-logo">
            AIR LEGACY
          </Link>

          {/* Right: Icons */}
          <div className="nav-icons">
            <button
              className="nav-icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

            {user ? (
              <Link href="/login" className="nav-icon-btn" aria-label="Account">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            ) : (
              <Link href="/login" className="nav-icon-btn" aria-label="Login">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            )}

            <button
              className="nav-icon-btn nav-cart-btn"
              onClick={() => setCartOpen(!cartOpen)}
              aria-label="Shopping Cart"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="search-bar" ref={searchRef}>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Produkte suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-submit">
                Suchen
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="search-close"
              >
                ✕
              </button>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                <div className="suggestions-header">
                  Gefundene Produkte ({searchSuggestions.length})
                </div>
                <div className="suggestions-list">
                  {searchSuggestions.map((product) => (
                    <button
                      key={product.id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(product.id)}
                      type="button"
                    >
                      <div className="suggestion-image">
                        <img src={product.imageUrl} alt={product.name} />
                      </div>
                      <div className="suggestion-info">
                        <div className="suggestion-name">{product.name}</div>
                        <div className="suggestion-meta">
                          <span className="suggestion-category">{product.category || 'Produkt'}</span>
                          <span className="suggestion-price">€{product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="suggestion-arrow">→</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Left Sidebar - Categories */}
      <div className={`sidebar sidebar-left ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>KATEGORIEN</h2>
          <button onClick={() => setSidebarOpen(false)} className="sidebar-close">
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          <button type="button" onClick={() => handleCategoryClick(null)}>Alle Produkte</button>
          <button type="button" onClick={() => handleCategoryClick('shoes')}>Schuhe</button>
          <button type="button" onClick={() => handleCategoryClick('apparel')}>Bekleidung</button>
          <button type="button" onClick={() => handleCategoryClick('accessories')}>Accessoires</button>
          <button type="button" onClick={() => handleCategoryClick('sale')}>Sale</button>
        </nav>

        <div className="sidebar-divider"></div>

        <div className="sidebar-section">
          <h3 className="sidebar-section-title">PREIS</h3>
          <nav className="sidebar-nav">
            <button type="button" onClick={() => handlePriceFilter(null, 50)}>Unter €50</button>
            <button type="button" onClick={() => handlePriceFilter(50, 100)}>€50 - €100</button>
            <button type="button" onClick={() => handlePriceFilter(100, 150)}>€100 - €150</button>
            <button type="button" onClick={() => handlePriceFilter(150, 200)}>€150 - €200</button>
            <button type="button" onClick={() => handlePriceFilter(200, null)}>Über €200</button>
          </nav>
        </div>
        {user && (
          <div className="sidebar-user">
            <p>Angemeldet als: <strong>{user.email}</strong></p>
            <button onClick={() => { signOut(); setSidebarOpen(false); }} className="sidebar-logout">
              Abmelden
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar - Shopping Cart */}
      <div className={`sidebar sidebar-right ${cartOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>WARENKORB</h2>
          <button onClick={() => setCartOpen(false)} className="sidebar-close">
            ✕
          </button>
        </div>
        <div className="sidebar-content">
          {cartItemCount > 0 ? (
            <>
              <p>{cartItemCount} Artikel im Warenkorb</p>
              <Link href="/cart" onClick={() => setCartOpen(false)} className="sidebar-cart-link">
                Zum Warenkorb
              </Link>
            </>
          ) : (
            <p className="empty-cart">Dein Warenkorb ist leer</p>
          )}
        </div>
      </div>

      {/* Overlay */}
      {(sidebarOpen || cartOpen) && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            setSidebarOpen(false);
            setCartOpen(false);
          }}
        />
      )}

      <style jsx>{`
        .navigation {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid var(--accent-orange);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1.5rem;
          align-items: center;
        }

        .nav-logo {
          grid-column: 2;
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: 3px;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
          transition: all 0.3s ease;
          text-align: center;
        }

        .nav-logo:hover {
          filter: brightness(1.2);
        }

        .nav-icons {
          grid-column: 3;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          justify-self: end;
        }

        .nav-icon-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .nav-menu-btn {
          grid-column: 1;
          justify-self: start;
          width: 48px;
          height: 48px;
          padding: 0;
          border-radius: 9999px;
          border: 2px solid rgba(255, 107, 0, 0.4);
          background: rgba(17, 17, 17, 0.9);
          box-shadow: 0 0 18px rgba(255, 107, 0, 0.25);
          transition: all 0.3s ease;
        }

        .nav-menu-btn:hover {
          border-color: var(--accent-orange);
          background: rgba(255, 107, 0, 0.18);
          box-shadow: 0 0 28px rgba(255, 107, 0, 0.35);
        }

        .nav-icon-btn:hover {
          color: var(--accent-orange);
          transform: scale(1.1);
        }

        .nav-icon-btn svg {
          width: 24px;
          height: 24px;
        }

        .nav-cart-btn {
          position: relative;
        }

        .cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--accent-orange);
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
          box-shadow: 0 2px 8px rgba(255, 107, 0, 0.6);
          border: 2px solid #000;
        }

        @media (max-width: 768px) {
          .nav-container {
            padding: 0.75rem 1rem;
            gap: 1rem;
          }

          .nav-logo {
            font-size: 1.25rem;
          }

          .nav-icons {
            gap: 1rem;
          }

          .nav-icon-btn {
            padding: 0.25rem;
          }

          .nav-menu-btn {
            width: 42px;
            height: 42px;
          }

          .nav-icon-btn svg {
            width: 20px;
            height: 20px;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        /* Sidebars */
        .sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          width: 320px;
          background: rgb(0, 0, 0);
          z-index: 10000;
          transition: transform 0.3s ease;
          display: flex;
          flex-direction: column;
          border: 2px solid #222;
          box-shadow: 0 0 80px rgba(0, 0, 0, 1);
        }

        .sidebar-left {
          left: 0;
          transform: translateX(-100%);
          border-right-color: var(--accent-orange);
        }

        .sidebar-left.open {
          transform: translateX(0);
        }

        .sidebar-right {
          right: 0;
          transform: translateX(100%);
          border-left-color: var(--accent-orange);
        }

        .sidebar-right.open {
          transform: translateX(0);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 2px solid #222;
          background: rgb(0, 0, 0);
        }

        .sidebar-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--accent-orange), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .sidebar-close {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: all 0.3s ease;
        }

        .sidebar-close:hover {
          color: var(--accent-orange);
          transform: rotate(90deg);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 1rem 0;
          background: rgb(0, 0, 0);
        }

        .sidebar-nav a,
        .sidebar-nav button {
          padding: 1rem 1.5rem;
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          border-left: 3px solid transparent;
          background: rgb(0, 0, 0);
          border: none;
          text-align: left;
          width: 100%;
          cursor: pointer;
        }

        .sidebar-nav a:hover,
        .sidebar-nav button:hover {
          background: rgba(255, 107, 0, 0.1);
          border-left-color: var(--accent-orange);
          padding-left: 2rem;
        }

        .sidebar-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-orange), transparent);
          margin: 1rem 0;
          opacity: 0.3;
        }

        .sidebar-section {
          padding: 0;
          background: rgb(0, 0, 0);
        }

        .sidebar-section-title {
          margin: 1rem 1.5rem 0.5rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: var(--accent-orange);
          text-transform: uppercase;
        }

        .sidebar-user {
          margin-top: auto;
          padding: 1.5rem;
          border-top: 2px solid #222;
          background: rgb(0, 0, 0);
        }

        .sidebar-user p {
          margin: 0 0 1rem 0;
          color: #fff;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .sidebar-user strong {
          color: var(--accent-green);
        }

        .sidebar-logout {
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: 2px solid var(--accent-orange);
          color: var(--accent-orange);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sidebar-logout:hover {
          background: var(--accent-orange);
          color: #000;
        }

        .sidebar-content {
          padding: 2rem 1.5rem;
          background: rgb(0, 0, 0);
          flex: 1;
        }

        .sidebar-content p {
          color: #fff;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .empty-cart {
          color: #666;
          text-align: center;
          font-style: italic;
        }

        .sidebar-cart-link {
          display: block;
          width: 100%;
          padding: 1rem;
          background: var(--accent-orange);
          color: white;
          text-align: center;
          text-decoration: none;
          font-weight: 900;
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }

        .sidebar-cart-link:hover {
          background: #ff8533;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 107, 0, 0.4);
        }

        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          backdrop-filter: blur(8px);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 280px;
          }
        }

        /* Search Bar */
        .search-bar {
          background: rgba(0, 0, 0, 0.98);
          border-bottom: 2px solid var(--accent-orange);
          padding: 1rem 2rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-form {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid #333;
          color: white;
          padding: 0.875rem 1.25rem;
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
        }

        .search-input:focus {
          border-color: var(--accent-orange);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 20px rgba(255, 107, 0, 0.2);
        }

        .search-input::placeholder {
          color: #666;
        }

        .search-submit {
          padding: 0.875rem 2rem;
          background: var(--accent-orange);
          border: none;
          color: #000;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .search-submit:hover {
          background: var(--accent-green);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 255, 135, 0.4);
        }

        .search-close {
          background: none;
          border: 2px solid #666;
          color: #666;
          padding: 0.875rem 1.25rem;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .search-close:hover {
          border-color: var(--accent-orange);
          color: var(--accent-orange);
          transform: rotate(90deg);
        }

        @media (max-width: 768px) {
          .search-bar {
            padding: 1rem;
          }

          .search-form {
            flex-wrap: wrap;
          }

          .search-input {
            flex: 1 1 100%;
            margin-bottom: 0.5rem;
          }

          .search-submit,
          .search-close {
            padding: 0.75rem 1.5rem;
            font-size: 0.875rem;
          }
        }

        /* Search Suggestions */
        .search-suggestions {
          max-width: 800px;
          margin: 1rem auto 0;
          background: rgba(0, 0, 0, 0.98);
          border: 2px solid var(--accent-orange);
          border-radius: 4px;
          overflow: hidden;
          animation: slideDown 0.3s ease;
          box-shadow: 0 10px 40px rgba(255, 107, 0, 0.3);
        }

        .suggestions-header {
          padding: 0.75rem 1.25rem;
          background: rgba(255, 107, 0, 0.1);
          border-bottom: 1px solid var(--accent-orange);
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--accent-orange);
        }

        .suggestions-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .suggestion-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: transparent;
          border: none;
          border-bottom: 1px solid #222;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: rgba(255, 107, 0, 0.1);
          border-left: 3px solid var(--accent-orange);
          padding-left: 1.5rem;
        }

        .suggestion-image {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          border: 2px solid #333;
          flex-shrink: 0;
          background: #1a1a1a;
        }

        .suggestion-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .suggestion-info {
          flex: 1;
          min-width: 0;
        }

        .suggestion-name {
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .suggestion-category {
          color: #999;
          text-transform: capitalize;
        }

        .suggestion-price {
          color: var(--accent-green);
          font-weight: 700;
        }

        .suggestion-arrow {
          color: var(--accent-orange);
          font-size: 1.5rem;
          font-weight: 700;
          flex-shrink: 0;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        .suggestion-item:hover .suggestion-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        @media (max-width: 768px) {
          .suggestions-list {
            max-height: 300px;
          }

          .suggestion-item {
            padding: 0.75rem 1rem;
          }

          .suggestion-image {
            width: 50px;
            height: 50px;
          }

          .suggestion-name {
            font-size: 0.875rem;
          }

          .suggestion-meta {
            font-size: 0.75rem;
            gap: 0.5rem;
          }
        }
      `}</style>
    </nav>
    </>
  );
}
