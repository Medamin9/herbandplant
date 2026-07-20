import '../styles/components/Footer.scss'
import { CiMail } from "react-icons/ci";
import { FaFacebookF, FaWhatsapp } from "react-icons/fa";
import { LiaPhoneSolid } from "react-icons/lia";
import { BsTelephone } from "react-icons/bs";
import { LiaWhatsapp } from "react-icons/lia";


import { LuInstagram } from "react-icons/lu";
import wetekup from '../assets/icons/wetekup.svg'
import { useLocation } from "react-router-dom";
import { IoLocationOutline } from "react-icons/io5";
const Footer = () => {
    const location = useLocation()

    return (
        <footer className="footer" style={location.pathname !== "/Contact" ? { borderTop: '1px solid #D3D3D3' } : {}}>
            <div className='footer-main'>
                <div className='footer-contact'>
                    <h3> Contact </h3>
                    <p> <CiMail size={24} /> Herbandplanta@gmail.com  </p>
                    <p> <BsTelephone  size={22} /> +216 54824122 </p>
                    <p> <LiaWhatsapp   size={28} /> +216 54151526 </p>
                    <p> <IoLocationOutline size={24} /> Ain Zagouan sud av carthage num 28 </p>
                </div>
                <div className='footer-findus'>
                    <h3> Boutique </h3>
                    <div className='quick-links'>
                        <a href=''> Soins de la peau  </a>
                        <a href=''> Miel et mélange  </a>
                        <a href=''> Plantes  </a>
                    </div>
                </div>
                <div className='footer-last'>
                    <div className='footer-languages'>
                        <h3> Langues </h3>
                        <select> 
                            <option> Français </option>
                            <option> Anglais </option>
                            <option> Arabe </option>
                        </select>
                    </div>
                    <div className='social-icons'>
                        <h3> Nous trouver </h3>
                        <div className='icons'>
                            <FaFacebookF size={24} />
                            <LuInstagram size={24} />
                            <FaWhatsapp  size={24} />
                        </div>
                    </div>
                </div>
            </div>
            <hr />
            <div className='footer-copyrights'>
                <p> 
                    <img src={wetekup} alt='wetekup logo minimal' />
                    © {new Date().getFullYear()} Herb and Plant. All rights reserved. Website designed by  
                    <a href='#' target='_blank'>WE TEKUP</a>
                </p>
            </div>
        </footer>
    )
}

export default Footer