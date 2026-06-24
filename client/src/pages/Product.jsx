import { useParams } from "react-router-dom";
import '../styles/pages/Product.scss';
import { useEffect, useState } from "react";
import axios from "axios";
import { SERVER } from "../hooks/config";
import ProductCard from '../components/ProductCard';
import { FaPlus, FaMinus } from "react-icons/fa6";
import { FiChevronRight } from "react-icons/fi";
import { useCart } from '../context/CartContext';
import CartSidebar from "../components/CartSidebar";
import gift from '../assets/icons/gift.svg';
import topBanner from '../assets/topbanner.svg';

const Product = () => {
    const { name } = useParams();
    const id = name.split("-")[0];
    const [activeTab, setActiveTab] = useState('description')
    const [product, setProduct] = useState()
    const [mainImage, setMainImage] = useState(null);
    const [otherImages, setOtherImages] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [selectedVolume, setSelectedVolume] = useState()
    const [quantity, setQuantity] = useState(1)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const { addToCart } = useCart(); 
    const [isCartOpen, setIsCartOpen] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const productRes = await axios.get(`${SERVER}/products/${id}`);
                const fetchedProduct = productRes.data.product;
                setProduct(fetchedProduct);
                setMainImage(SERVER + fetchedProduct.banner);
                setOtherImages(
                    fetchedProduct.images.map((img) => SERVER + img).filter(Boolean)
                );
            } catch (err) {
                console.log(err);
            }
        };

        const fetchRecommendations = async () => {
            try {
                const recRes = await axios.get(`${SERVER}/products/recommendations/${id}`);
                setHomeData({
                    topSellingProducts: recRes.data.products
                });
                
            } catch (err) {
                console.log(err);
            }
        };

        fetchProduct();
        fetchRecommendations();
    }, [id]);

    const handleImageClick = (clickedImg) => {
        setOtherImages((prev) => {
            const updated = [mainImage, ...prev.filter((img) => img !== clickedImg)];
            return updated;
        });
        setMainImage(clickedImg);
    };

    const handleAddToCart = () => {
        if (!selectedVolume) {
            alert("Veuillez sélectionner un Volume");
            return;
        }
        
        addToCart(product, quantity, selectedVolume);
        setIsCartOpen(true);
    };
    const [homeData, setHomeData] = useState({
        topSellingProducts: []
    })
    const formatProducts = (products) => {
        return products.map(product => {
            const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
            const promotion = typeof product.promotion === 'string' ? parseFloat(product.promotion) : product.promotion;
            
            const finalPrice = promotion > 0 ? price * (1 - promotion / 100) : price;
            
            return {
                id: product.id,
                banner: product.banner,
                name: product.name,
                price: finalPrice,
                originalPrice: promotion > 0 ? price : null,
                product: product
            };
        });
    };
    const topSellingList = formatProducts(homeData.topSellingProducts);
    const topSellingPerPage = isMobile ? 3 : 3;
    const [topSellingPage, setTopSellingPage] = useState(0);
    const PaginationDots = ({ totalPages, currentPage, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="pagination-dots">
            {Array.from({ length: totalPages }).map((_, index) => (
                <span
                key={index}
                className={`dot ${index === currentPage ? "active" : ""}`}
                onClick={() => onPageChange(index)}
                />
            ))}
        </div>
    );};

    
    const topSellingPages = Math.ceil(topSellingList.length / topSellingPerPage);
    const displayedTopSelling = topSellingList.slice(
        topSellingPage * topSellingPerPage,
        (topSellingPage + 1) * topSellingPerPage
    );

    
    if (!product) {
     return <div className="main-container">Loading...</div>;
    }
    return (
        <div className="main-container">
            <div className="product-container">
                <div className="breadcamps">
                    <a href="/products"> Tous les produits </a>
                    <FiChevronRight />
                    <span> {product.name} </span>
                </div>
                <div className="product-display">
                    <div className="product-images">
                        <div className="other-images">
                        {otherImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`${product.name} thumbnail ${idx + 1}`}
                                onClick={() => handleImageClick(img)}
                                style={{ cursor: "pointer" }}
                            />
                        ))}
                        </div>
                        <div className="main-image">
                            {product.stock_repture === true? (
                                <div className='product-card-out'> Out of Stock </div>
                            ) :
                            product.promotion > 0 ? (
                                <div className='product-card-promo'> {parseInt(product.promotion)}% </div>
                            ) : product.top_vente === true ? (
                                <div className='product-top-card'> BEST SELLER </div>
                            ) : product.new_product === true && (
                                <div className='product-card-new'> NEW </div>
                            )}
                            <img src={mainImage} alt={product.name + " main"} />
                        </div>
                    </div>
                    <div className="product-details">
                        <span className="subtitle"> {product.category_name} </span>
                        <h1> {product.name} </h1>
                        <div className="product-card-price">
                            {product.promotion > 0 ? (
                                <div className="price-section">
                                    <span className="old-price"> {product.price} DT </span>
                                    <span className="new-price"> {(product.price - (product.price * product.promotion) / 100).toFixed(2)} DT </span>
                                </div>
                            ) : (
                                <span className="origin-price"> {product.price} DT </span>
                            )}
                        </div>
                        <div className="description-container">
                            <p> {product.description} </p>
                        </div>
                        <div className="volumes-container">
                            <span>Volume</span>
                            <div className="volumes">
                                {product.volumes.map((volume, index) => (
                                    <button key={index} className={`volume ${selectedVolume === volume && 'selected'}`} onClick={(e) => setSelectedVolume(volume)} disabled={product.stock_repture === true}> {volume} </button>
                                ))}
                            </div>
                        </div>
                        <span className="quantity-title"> Quantity : </span>
                        <div className="quantity-container">
                            <button onClick={() =>{
                                if (quantity !== 1) setQuantity(quantity - 1)
                            }} disabled={quantity === 1}> <FaMinus /> </button>
                            <span> {quantity} </span>
                            <button onClick={() => setQuantity(quantity + 1)} disabled={product.stock_repture === true}> <FaPlus /> </button>
                        </div>
                        <button className="add-to-cart" onClick={handleAddToCart} disabled={product.stock_repture === true}> Ajouter au panier </button>
                        <div className="annoucement">
                            <img src={gift} alt="gift icon" /> <span> Livraison gratuite dès 200 DT d'achat </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="product-tabs">
                {isMobile ? (
                    <div className="tabs-header">
                    {[
                        { id: "description", label: "Description", content: product.long_description },
                        { id: "composition", label: "Composition", content: product.composition },
                        { id: "usage", label: "Conseils d'utilisation", content: product.usage },
                    ].map((tab) => (
                        <div key={tab.id} className={`tab-item ${activeTab === tab.id ? "open" : ""}`}>
                        <button
                            className={activeTab === tab.id ? "active" : ""}
                            onClick={() => setActiveTab(activeTab === tab.id ? "" : tab.id)}
                        >
                            {tab.label}
                            <FiChevronRight
                            className={`chevron-icon ${activeTab === tab.id ? "rotated" : ""}`}
                            />
                        </button>
                        {activeTab === tab.id && (
                            <div className="tab-content">
                                <p>{tab.content}</p>
                            </div>
                        )}
                        </div>
                    ))}
                    </div>
                ) : (
                    <>
                    <div className="tabs-header">
                        <button
                        className={activeTab === "description" ? "active" : ""}
                        onClick={() => setActiveTab("description")}
                        >
                        Description
                        </button>
                        <button
                        className={activeTab === "composition" ? "active" : ""}
                        onClick={() => setActiveTab("composition")}
                        >
                        Composition
                        </button>
                        <button
                        className={activeTab === "usage" ? "active" : ""}
                        onClick={() => setActiveTab("usage")}
                        >
                        Conseils d'utilisation
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === "description" && <p>{product.long_description}</p>}
                        {activeTab === "composition" && <p>{product.composition}</p>}
                        {activeTab === "usage" && <p>{product.usage}</p>}
                    </div>
                    </>
                )}
            </div>
            {window.innerWidth > 768 ? (
                <div className='top-ventes-section-desktop'> 
                    <h2> Top ventes </h2>
                    {homeData.topSellingProducts.length > 0 ? (
                        <div className='top-ventes-content'>
                            <div className='left-banner'>
                                <img src={topBanner} alt="Top ventes banner" />
                            </div>
                            <div className='right-products'>
                                <div className='products-scroll-container'>
                                    <div className='products-grid'>
                                        {topSellingList.slice(topSellingPage * 2, (topSellingPage + 1) * 2).map((product, index) => (
                                            <ProductCard 
                                                key={`top-${index}`} 
                                                product={product} 
                                                addToCartState={false} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                {topSellingList.length > 2 && (
                                    <PaginationDots
                                        totalPages={Math.ceil(topSellingList.length / 2)}
                                        currentPage={topSellingPage}
                                        onPageChange={setTopSellingPage}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='discover-not-found'>
                            <span> There's nothing to display for this section. </span>
                        </div>
                    )}
                </div>
            ) : (
                <div className='top-ventes-section mobile'> 
                    <h2> Top ventes </h2>
                    {homeData.topSellingProducts.length > 0 ? (
                        <div className='top-ventes-content-mobile'>
                            <div className='left-banner-mobile'>
                                <img src={topBanner} alt="Top ventes banner" />
                            </div>
                            <div className='right-products-mobile'>
                                <div className='products-scroll-container'>
                                    <div className='products-grid'>
                                        {topSellingList.slice(topSellingPage * 2, (topSellingPage + 1) * 2).map((product, index) => (
                                            <ProductCard 
                                                key={`top-mobile-${index}`} 
                                                product={product} 
                                                addToCartState={false} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                {topSellingList.length > 2 && (
                                    <PaginationDots
                                        totalPages={Math.ceil(topSellingList.length / 2)}
                                        currentPage={topSellingPage}
                                        onPageChange={setTopSellingPage}
                                    />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='discover-not-found'>
                            <span> There's nothing to display for this section. </span>
                        </div>
                    )}
                </div>
            )}
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default Product;
