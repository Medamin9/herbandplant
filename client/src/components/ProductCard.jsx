import { SERVER } from "../hooks/config"
import '../styles/components/ProductCard.scss'

const ProductCard = ({ product, addToCartState = true, showInfo = true, isFirst = false, showCard = true }) => {
    return (
        <div className={`product-card ${isFirst ? 'first-product' : ''}`} onClick={() => window.location.href = `/product/${product.id+'-'+product.name}`}>
                <div className="product-card-image">
                    {showCard === true && (product.stock_repture === true ? (
                        <div className='out-card'>Out of Stock</div>
                    ) : product.promotion > 0 ? (
                        <div className='promo-card'> {parseInt(product.promotion)}% </div>
                    ) : product.top_vente === true ? (
                        <div className='top-card'> BEST SELLER </div>
                    ) : product.new_product === true && (
                        <div className='new-card'> NEW </div>
                    ))}
                    <img src={SERVER + product.banner} alt={product.name} className='product-image' />
                </div>
            
            {showInfo && (
                <div className='product-info'>
                    <h3> {product.name} </h3>
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
                </div>
            )}
            {addToCartState && <button className='product-actions' disabled={product.stock_repture === true}> Add to cart </button>}
        </div>
    )
}

export default ProductCard;