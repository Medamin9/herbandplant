import axios from 'axios';
import '../styles/pages/Products.scss'
import { useEffect, useState } from 'react';
import { SERVER } from '../hooks/config';
import ProductCard from '../components/ProductCard';
import { MdFilterList } from "react-icons/md";
import { MdChevronRight, MdChevronLeft } from "react-icons/md";
import { useSearchParams } from 'react-router-dom';

const Products = () => {
    const [searchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // dynamic lists for filters

    // Filters state
    const [filters, setFilters] = useState({
        category_id: "",
        min_price: 0,
        max_price: 1000,
        promotion: false,
        new_product: false,
        top_vente: false,
        search: ""
    });

    // Set category filter from URL on component mount
    useEffect(() => {
        const categoryIdFromUrl = searchParams.get('category_id');
        if (categoryIdFromUrl) {
            setFilters(prev => ({ ...prev, category_id: categoryIdFromUrl }));
            setShowFilters(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${SERVER}/categories`);
                setCategories(res.data.categories);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const params = { 
                    ...filters, 
                    page: currentPage, 
                    limit: 12
                };

                const res = await axios.get(`${SERVER}/products`, { params });

                setProducts(res.data.products || []);
                setTotalProducts(res.data.pagination?.total_products || 0);
                setTotalPages(res.data.pagination?.total_pages || 1);
            } catch (err) {
                console.error("Error fetching products:", err);
            }
        };
        fetchProducts();
    }, [filters, currentPage]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    // Toggle checkbox for arrays
    const toggleFilterArray = (key, value) => {
        setFilters(prev => {
            const current = prev[key];
            if (current.includes(value)) {
                return { ...prev, [key]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [key]: [...current, value] };
            }
        });
        setCurrentPage(1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return(
        <div className='main-container'>
            <div className='products-container'>
                <h1> Tous les produits </h1>
                <div className='header-section'> 
                    <button onClick={() => setShowFilters(!showFilters)}> <MdFilterList /> Filtrer </button>
                </div>
                <div className='products-main'>
                    {showFilters && (
                        <div className='filter-sidebar'>
                            <div className="filter-sidebar-content">
                                {/* Categories */}
                                <div className="filter-section">
                                    <h4>Catégories</h4>
                                    <div className="category-checkboxes">
                                        {categories.map((cat) => (
                                            <label key={cat.id} className="checkbox-label">
                                                <input
                                                    type="radio"
                                                    name="category"
                                                    value={cat.id}
                                                    checked={filters.category_id === String(cat.id)}
                                                    onChange={(e) => updateFilter("category_id", e.target.value)}
                                                />
                                                <span>{cat.name}</span>
                                            </label>
                                        ))}
                                        <label className="checkbox-label">
                                            <input
                                                type="radio"
                                                name="category"
                                                value=""
                                                checked={filters.category_id === ""}
                                                onChange={() => updateFilter("category_id", "")}
                                            />
                                            <span>Toutes</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="filter-section">
                                    <h4>Prix</h4>
                                    <div className="price-slider-container">
                                        <div className="price-slider">
                                            <div className="slider-track"></div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000"
                                                value={filters.min_price}
                                                className="slider-min"
                                                onChange={(e) => updateFilter("min_price", Number(e.target.value))}
                                            />
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000"
                                                value={filters.max_price}
                                                className="slider-max"
                                                onChange={(e) => updateFilter("max_price", Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="price-values">
                                            <span>{filters.min_price} DT</span>
                                            <span>{filters.max_price} DT</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Promotions / Nouveautés / Top */}
                                <div className="filter-section">
                                    <h4>Filtres spéciaux</h4>
                                    <div className="filter-checkboxes">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={filters.promotion}
                                                onChange={(e) => updateFilter("promotion", e.target.checked)}
                                            />
                                            <span>En promotion</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={filters.new_product}
                                                onChange={(e) => updateFilter("new_product", e.target.checked)}
                                            />
                                            <span>Nouveautés</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={filters.top_vente}
                                                onChange={(e) => updateFilter("top_vente", e.target.checked)}
                                            />
                                            <span>Meilleures ventes</span>
                                        </label>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="filter-actions">
                                    <button
                                        className="clear-filters"
                                        onClick={() =>
                                            setFilters({
                                                category_id: "",
                                                min_price: 0,
                                                max_price: 1000,
                                                promotion: false,
                                                new_product: false,
                                                top_vente: false,
                                                search: ""
                                            })
                                        }
                                    >
                                        Réinitialiser
                                    </button>
                                    <button
                                        className="apply-filters"
                                        onClick={() => setCurrentPage(1)}
                                    >
                                        Appliquer
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className='products-found'>
                        {products.map((product) => (
                            <ProductCard product={product} key={product.id} />
                        ))}
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        <button onClick={goToPrevPage} disabled={currentPage === 1}>
                            <MdChevronLeft />
                        </button>
                    
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={currentPage === i + 1 ? 'active' : ''}
                            >
                                {i + 1}
                            </button>
                        ))}
                    
                        <button onClick={goToNextPage} disabled={currentPage === totalPages}>
                            <MdChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Products