import '../styles/pages/Aboutus.scss';
import owner from '../assets/aboutus/owner.webp'
import layer from '../assets/aboutus/layer.svg'
import service1 from '../assets/aboutus/service1.webp'
import service2 from '../assets/aboutus/service2.webp'
import service3 from '../assets/aboutus/service3.webp'
import service4 from '../assets/aboutus/service4.webp'
import banner from '../assets/aboutus/banner.webp'

const AboutUs = () => {

  return (
    <div className="aboutus-container"> 
        <div className='welcome'>
            <div className='welcome-text'>
                <h1>Bienvenue chez Herb and Plant !</h1>
                <span>
                    Je suis Mona Houmaiza, originaire du Maroc, passionnée par la beauté et le bien-être au naturel. Depuis plus de 25 ans, je crée des produits naturels et des soins esthétiques inspirés par la richesse de la culture berbère, combinant tradition ancestrale et expertise moderne.
                </span>
                <span>
                    Aujourd'hui, basée à Tunis, j’ai fondé Herb and Plant pour partager avec vous les trésors de ma culture et de ma terre natale. Nos produits sont 100 % naturels et conçus pour offrir des résultats rapides et durables, que ce soit pour vos cheveux, votre peau ou votre corps.
                </span>
            </div>
            <div className='welcome-image'>
                <img src={owner} alt='owner' className='owner' />
                <img src={layer} alt='layer' className='layer' />
            </div>
        </div>
        <div className='services'>
            <h2>Nous proposons :</h2>
            <div className='services-container'>
                <div className='service'>
                    <img src={service1} alt='service1' />
                    <span>Huiles et extraits de plantes</span>
                </div>
                <div className='service'>
                    <img src={service2} alt='service2' />
                    <span>Soins à base de miel et dérivés du miel</span>
                </div>
                <div className='service'>
                    <img src={service3} alt='service3' />
                    <span>Shampoings et soins capillaires</span>
                </div>
                <div className='service'>
                    <img src={service4} alt='service4' />
                    <span>Packs pour le visage, le corps et le hammam marocain</span>
                </div>
            </div>
        </div>
        <div className='footer-banner'>
            <h2>Chez Herb and Plant,</h2>
            <span> 
                chaque produit raconte une histoire : celle du Maroc, de ses traditions et de la nature,{window.innerWidth >= 768 && <br/>}
                au service de votre beauté et de votre bien-être. Découvrez nos produits et laissez-vous séduire par la magie des soins{window.innerWidth >= 768 && <br/>}naturels marocains, maintenant accessibles à Tunis.
            </span>
            <img src={banner} alt='banner' />
        </div>
    </div>
  );
};

export default AboutUs;
