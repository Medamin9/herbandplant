import '../styles/components/CategoryCard.scss'
import { SERVER } from '../hooks/config'
import { useNavigate } from 'react-router-dom'

const CategoryCard = ({ category }) =>{
    const navigate = useNavigate()

    const handleCategoryClick = () => {
        navigate(`/products?category_id=${category.id}`)
    }

    return(
        <div className="category-card" onClick={handleCategoryClick}>
            <img src={SERVER+category.image} alt={category.name} />
            <button> {category.name} </button>
        </div>
    )
}

export default CategoryCard;