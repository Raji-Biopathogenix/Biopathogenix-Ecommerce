"use client";
import { useEffect,useState,useRef } from "react";
import './search.css'
import {SearchCategoryItem,TopSearchItem} from "@/types/header"
import { useRouter } from "next/navigation";


interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  search_categories:SearchCategoryItem[]
  top_searchs:TopSearchItem[] 
}
 

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose,search_categories,top_searchs }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const router = useRouter();

  
  // Advanced search filters
  const [filters, setFilters] = useState({
    priceRange: { min: '', max: '' },
    inStock: false,
    sortBy: 'relevance'
  });
 
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
 
  const updateRangeFilter = (key: string, subkey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: { ...prev[key as keyof typeof prev] as any, [subkey]: value }
    }));
  };
 
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
 
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
 
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);
 
  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
 
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
 
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);
 
  const handleSearch = () => {
    if(category !='' && searchTerm!=''){
      const params = new URLSearchParams({
        category: category,
        search_text: searchTerm,
      });
      router.push(`/search?${params.toString()}`)
      onClose()
    }else if(category !=''){
      const params = new URLSearchParams({
        category: category,
      });
      router.push(`/search?${params.toString()}`)
      onClose()
    }else if(searchTerm!=''){
       const params = new URLSearchParams({
        search_text: searchTerm,
      });
      router.push(`/search?${params.toString()}`)
      onClose()
    }
  };

   
  const handleAdvancedSearch = () => {
    console.log('Search executed:', { searchTerm, category, filters, advanced: showAdvanced });
    // Here you would typically call your search API
  };
 
  const resetFilters = () => {
    setSearchTerm('');
    setCategory('');
    setFilters({
      priceRange: { min: '', max: '' },
      inStock: false,
      sortBy: 'relevance'
    });
  };
 
  if (!open) return null;


 
  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: '160px', 
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99,
          animation: 'fadeIn 0.2s ease-out forwards'
        }}
        onClick={onClose} 
      />
      
      <div 
        ref={modalRef}
        style={{
          position: 'fixed',
          top: '70px',
          left: 0,
          right: 0,
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          zIndex: 100,
          maxHeight: 'calc(100vh - 160px)', 
          overflowY: 'auto',
          animation: 'slideDown 0.3s ease-out forwards'
        }}
      >
        <div style={{
     
          color: 'white',
          padding: '20px 24px'
        }}>
         
 
          <label htmlFor="search-input " className="text-sm" style={{ maxWidth: '800px', margin: '20px auto 5px', display: 'flex' ,color:'#002C56'}}>Search biopathogenix.com</label>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex' }}>
            <input
              type="text"
              placeholder="TYPE TO SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                borderRadius: '6px 0 0 6px',
                background: 'white',
                color:'gray',
                borderWidth:'1px 0px 1px 1px',
                borderStyle:'solid',
                borderColor:'gray'
              }}
            />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: '12px 16px',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                background: 'white',
                cursor: 'pointer',
                minWidth: '120px',
                color: '#666',
                borderWidth:'1px 0px 1px 1px',
                borderStyle:'solid',
                borderColor:'gray'
              }}
            >
              <option value="">CATEGORY</option>
              {
                search_categories?.map((e,index)=> (<option key={`${e?.name}-${e?.id}`} value={e?.name}>{e?.name}</option>))
              }
            </select>
            <button 
              onClick={handleSearch}
              style={{
                padding: '12px 20px',
                background: '#4f83ff',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '0 6px 6px 0'
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              SEARCH
            </button>
          </div>
        </div>
 
        <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', background: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: showAdvanced ? '24px' : '32px' }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: '0 auto'
              }}
            >
              <svg 
                width="14" height="14" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{
                  transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Search
            </button>
          </div>
 
          {showAdvanced && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1e293b' }}>
                  Advanced Search Filters
                </h3>
                <button 
                  onClick={resetFilters}
                  style={{
                    background: 'transparent',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  Reset All
                </button>
              </div>
 
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Price Range ($)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => updateRangeFilter('priceRange', 'min', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => updateRangeFilter('priceRange', 'max', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
 
              </div>
 
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                  Availability & Special Options
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'inStock', label: 'In Stock Only' },
                  ].map((option) => (
                    <label key={option.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={filters[option.key as keyof typeof filters] as boolean}
                        onChange={(e) => updateFilter(option.key, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', color: '#374151' }}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
 
              {/* Sort By */}
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Sort Results By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '13px',
                    minWidth: '200px'
                  }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="bestsellers">Best Sellers</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
 
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                  onClick={handleAdvancedSearch}
                  style={{
                    background: '#1e40af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 32px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search with Filters
                </button>
              </div>
            </div>
          )}
 
          {/* Quick Categories (only show when advanced search is hidden) */}
          {!showAdvanced && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Popular Categories</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '12px'
              }}>
                {search_categories?.map((category) => (
                  <button key={category.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  
                  >
                   {category.image && ( <span style={{
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      background: '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                     
                        <img src={category.image} alt={category.name} className="nav-dropdown__img" />
                    
                    </span>  )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>
                        {category.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                        {category.product_count+' items'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
 
          {/* Popular Searches (only show when advanced search is hidden) */}
          {!showAdvanced && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Popular This Week</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {top_searchs.map((term) => (
                  <button 
                    key={term?.name} 
                    onClick={() => setSearchTerm(term?.name)}
                    style={{
                      padding: '8px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '20px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {term?.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* Footer */}
        <div style={{
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 24px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Need help finding something? <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Contact our specialists</a>
            </span>
            
          </div>
        </div>
      </div>
 
      <style jsx>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}; 
