import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import '../../../styles/pages/Admins/BannersPanel.scss';

const BannersPanel = () => {
    const [banners, setBanners] = useState([]);
    const [desktopFile, setDesktopFile] = useState(null);
    const [mobileFile, setMobileFile] = useState(null);
    const [desktopPreview, setDesktopPreview] = useState(null);
    const [mobilePreview, setMobilePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await axios.get(`${SERVER}/banners`, {
                withCredentials: true
            });
            setBanners(res.data.banners);
        } catch (err) {
            console.error('Error fetching banners:', err);
            alert('Erreur lors du chargement des bannières');
        } finally {
            setLoading(false);
        }
    };

    const handleDesktopFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDesktopFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setDesktopPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleMobileFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMobileFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setMobilePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        
        if (!desktopFile || !mobileFile) {
            alert('Veuillez sélectionner les deux images (bureau et mobile)');
            return;
        }

        const formData = new FormData();
        formData.append('desktop_image', desktopFile);
        formData.append('mobile_image', mobileFile);

        setUploading(true);

        try {
            await axios.post(`${SERVER}/banners`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Bannière téléchargée avec succès');
            fetchBanners();
            setDesktopFile(null);
            setMobileFile(null);
            setDesktopPreview(null);
            setMobilePreview(null);
            // Reset file inputs
            document.getElementById('desktop-input').value = '';
            document.getElementById('mobile-input').value = '';
        } catch (err) {
            console.error('Error uploading banner:', err);
            alert('Erreur lors du téléchargement de la bannière');
        } finally {
            setUploading(false);
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.put(`${SERVER}/banners/${id}/activate`, {}, {
                withCredentials: true
            });
            alert('Bannière activée avec succès');
            fetchBanners();
        } catch (err) {
            console.error('Error activating banner:', err);
            alert('Erreur lors de l\'activation de la bannière');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) {
            return;
        }

        try {
            await axios.delete(`${SERVER}/banners/${id}`, {
                withCredentials: true
            });
            alert('Bannière supprimée avec succès');
            fetchBanners();
        } catch (err) {
            console.error('Error deleting banner:', err);
            alert(err.response?.data?.error || 'Erreur lors de la suppression de la bannière');
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '18px',
                color: '#6c757d',
                width: 'screen',
                height: 'screen'
            }}>
                Chargement...
            </div>
        );
    }

    return (
        <div className="banners-panel">
            <h2>Gestion des Bannières</h2>
            
            {/* Upload Form */}
            <div className="upload-section">
                <h3>Télécharger une nouvelle bannière</h3>
                <form onSubmit={handleUpload} className="banner-upload-form">
                    <div className="upload-row">
                        <div className="upload-group">
                            <label>Bannière Bureau (Recommandé: 1920x600px)</label>
                            <input
                                id="desktop-input"
                                type="file"
                                accept="image/*"
                                onChange={handleDesktopFileChange}
                            />
                            {desktopPreview && (
                                <div className="preview">
                                    <img src={desktopPreview} alt="Aperçu bureau" />
                                </div>
                            )}
                        </div>
                        <div className="upload-group">
                            <label>Bannière Mobile (Recommandé: 768x600px)</label>
                            <input
                                id="mobile-input"
                                type="file"
                                accept="image/*"
                                onChange={handleMobileFileChange}
                            />
                            {mobilePreview && (
                                <div className="preview">
                                    <img src={mobilePreview} alt="Aperçu mobile" />
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="submit" disabled={uploading || !desktopFile || !mobileFile}>
                        {uploading ? 'Téléchargement...' : 'Télécharger la bannière'}
                    </button>
                </form>
            </div>

            {/* Banners List */}
            <div className="banners-list">
                <h3>Bannières existantes</h3>
                {banners.length === 0 ? (
                    <p className="no-banners">Aucune bannière disponible</p>
                ) : (
                    <div className="banners-grid">
                        {banners.map((banner) => (
                            <div key={banner.id} className={`banner-item ${banner.is_active ? 'active' : ''}`}>
                                <div className="banner-preview">
                                    <div className="preview-image">
                                        <span className="label">Bureau</span>
                                        <img src={SERVER + banner.desktop_image} alt="Bureau" />
                                    </div>
                                    <div className="preview-image">
                                        <span className="label">Mobile</span>
                                        <img src={SERVER + banner.mobile_image} alt="Mobile" />
                                    </div>
                                </div>
                                <div className="banner-info">
                                    <span className="banner-date">
                                        Créé le: {new Date(banner.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                    {banner.is_active && (
                                        <span className="active-badge">✓ Active</span>
                                    )}
                                </div>
                                <div className="banner-actions">
                                    {!banner.is_active && (
                                        <button 
                                            className="btn-activate"
                                            onClick={() => handleActivate(banner.id)}
                                        >
                                            Activer
                                        </button>
                                    )}
                                    <button 
                                        className="btn-delete"
                                        onClick={() => handleDelete(banner.id)}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BannersPanel;
