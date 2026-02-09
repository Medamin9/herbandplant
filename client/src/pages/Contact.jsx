import '../styles/pages/Contact.scss';
import contactImage from '../assets/contact.svg'
import contactImageMobile from '../assets/contact_mobile.svg'
import contactFooter from '../assets/contact_footer.svg'
const Contact = () => {
  return (
    <div className="contact-container"> 
      <div className='contact-main'>
        <div className='contact-image'>
          <img src={window.innerWidth > 768 ?contactImage : contactImageMobile} alt='contact' />
        </div>
        <form className="contact-form">
            <h1>Nous contacter</h1>
            <input type="text" placeholder="Nom" required />
            <input type="text" placeholder="Prenom" required />
            <input type="text" placeholder="Numéro de téléphone" required />
            <input type="email" placeholder="E-mail" required />
            <textarea placeholder="Message" className="message" required></textarea>
            <button type="submit">Send</button>
        </form>
      </div>
      <div className='contact-footer'>
        <img src={contactFooter} alt='footer' />
      </div>
    </div>
  );
};

export default Contact;