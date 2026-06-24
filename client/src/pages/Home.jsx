import '../styles/pages/Home.scss'
import { useNavigate } from 'react-router-dom'

import banner from '../assets/banner.webp'
import bannerMobile from '../assets/banner-mobile.webp'
import topBanner from '../assets/topbanner.webp'
import { useEffect, useState } from 'react'
import CategoryCard from '../components/CategoryCard'
import axios from 'axios'
import { SERVER } from '../hooks/config'
import ProductCard from '../components/ProductCard'
import { IoStar } from "react-icons/io5";
import quote from '../assets/icons/quote.svg'
import firstMarrocanImage from '../assets/Marrocan/1.webp'
import secondMarrocanImage from '../assets/Marrocan/2.webp'
import thirdMarrocanImage from '../assets/Marrocan/3.webp'

const Home = () => {
    const navigate = useNavigate()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [categories, setCategories] = useState([])
    const [homeData, setHomeData] = useState({
        newProduct: null,
        promotedProduct: null,
        topSellerProduct: null,
        newProducts: [],
        topSellingProducts: []
    })
    const [reviews, setReviews] = useState([])
    const [loadingReviews, setLoadingReviews] = useState(true)
    const [categoryPage, setCategoryPage] = useState(0);
    const [newProductsPage, setNewProductsPage] = useState(0);
    const [topSellingPage, setTopSellingPage] = useState(0);
    const [bannerImages, setBannerImages] = useState({
        desktop: banner,
        mobile: bannerMobile
    });

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

    const newProductsList = formatProducts(homeData.newProducts);
    const topSellingList = formatProducts(homeData.topSellingProducts);

    const itemsPerPage = isMobile ? 2 : categories.length;
    const newProductsPerPage = isMobile ? 2 : 4;
    const topSellingPerPage = isMobile ? 3 : 3;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const categoriesResponse = await axios.get(`${SERVER}/categories`);
                setCategories(categoriesResponse.data.categories);
                const homeDataResponse = await axios.get(`${SERVER}/products/home/data`);
                setHomeData(homeDataResponse.data);
                const reviewsResponse = await axios.get(`${SERVER}/reviews`);
                setReviews(reviewsResponse.data.reviews);
                setLoadingReviews(false);
                
                // Fetch banner images
                const bannerResponse = await axios.get(`${SERVER}/banners/active`);
                if (bannerResponse.data.banner) {
                    setBannerImages({
                        desktop: SERVER + bannerResponse.data.banner.desktop_image,
                        mobile: SERVER + bannerResponse.data.banner.mobile_image
                    });
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setLoadingReviews(false);
            }
        }
        fetchData();
    }, []);

    const displayedCategories = isMobile ? categories.slice(categoryPage, categoryPage + 2)
    : categories.slice(
      categoryPage * itemsPerPage,
      (categoryPage + 1) * itemsPerPage
    );

    const displayedNewProducts = newProductsList.slice(
        newProductsPage * newProductsPerPage,
        (newProductsPage + 1) * newProductsPerPage
    );

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

    const categoryPages = isMobile ? Math.max(categories.length - 1, 1) : Math.ceil(categories.length / itemsPerPage);
    const newProductsPages = Math.ceil(newProductsList.length / newProductsPerPage);

    return (
        <div className="main-container">
            <div className="banner-container">
                <img src={window.innerWidth > 768 ? bannerImages.desktop : bannerImages.mobile} alt="banner" />
                <div className="banner-title">
                    <h1> Toute votre<br/>beauté au<br/>naturel </h1>
                    <button onClick={() => navigate('/products')}> 
                        Voir produits
                    </button>
                </div>
            </div>
            
            <div className='categories'>
                <div className='categories-container'>
                    {categories.length > 0 ? (
                        <div className='categories-main-container'>
                        <h2> Nos catégories </h2>
                        <div className="categories-found">
                            {displayedCategories.map((category) => (
                            <CategoryCard key={category.id} category={category} />
                            ))}
                        </div>
                        {isMobile && (
                            <PaginationDots
                                totalPages={categoryPages}
                                currentPage={categoryPage}
                                onPageChange={setCategoryPage}
                            />
                        )}
                        </div>
                    ) : (
                        <div className="categories-not-found">
                        <span> No categories for now. </span>
                        </div>
                    )}
                </div>
            </div>
            <div className='top-products-container'> 
                <h2> Nouveautés </h2>
                {newProductsList.length > 0 ? (
                    <div className='top-products-grid'>
                        <div className='top-found'>
                            {displayedNewProducts.map((product, index) => (
                                <ProductCard key={index} product={product} addToCartState={false} />
                            ))}
                        </div>
                        {isMobile && (
                            <PaginationDots
                                totalPages={newProductsPages}
                                currentPage={newProductsPage}
                                onPageChange={setNewProductsPage}
                            />
                        )}
                    </div>
                ) : (
                    <div className='discover-not-found'>
                        <span> There's nothing to display for this section. </span>
                    </div>
                )}
            </div>
            <div className='marrocan-container'>
                <div className='marrocan-images'>
                    <img src={firstMarrocanImage} alt="marrocan" />
                    <img src={secondMarrocanImage} alt="marrocan" />
                    <img src={thirdMarrocanImage} alt="marrocan" />
                </div>
                <div className='marrocan-text'>
                    <span> Notre marque propose des produits  marocains,{window.innerWidth > 768 ? <br/> : ' '}100 % végétaux et naturels. </span>
                    <button onClick={() => navigate('/products')}>Voir plus</button>
                </div>
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
            <div className='avis-section'>
                <h2> Avis de nos clients </h2>
                <div className='testimonial-container'>
                    {loadingReviews ? (
                        <div className="loading-reviews">
                            <p>Chargement des avis...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="no-reviews">
                            <p>Aucun avis disponible pour le moment</p>
                        </div>
                    ) : (
                        <>
                            {reviews.map((test, index) => (
                                <div
                                    key={index}
                                    className={`testimonial-card ${index % 2 === 0 ? "even" : ""}`}
                                >
                                    <div className="quote-icon">
                                        <img src={quote} alt="quote" />
                                    </div>
                                    <div className="stars">
                                        <IoStar /><IoStar /><IoStar /><IoStar /><IoStar />
                                    </div>
                                    <div className="review-content">
                                        <span className="avis">{test.description}</span>
                                        <div className="author-section">
                                            {test.image && (
                                                <img src={`${SERVER}${test.image}`} alt={test.author} className="author-image" />
                                            )}
                                            <span className="author">{test.author}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Home;