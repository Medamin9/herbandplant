import '../styles/components/CategoryCard.scss'
import { SERVER } from '../hooks/config'

const CategoryCard = ({ category }) =>{
    return(
        <div className="category-card">
            <img src={SERVER+category.image} alt={category.name} />
            <button> {category.name} </button>
        </div>
    )
}

export default CategoryCard;