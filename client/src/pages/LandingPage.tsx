import AuthHeader from '../components/AuthHeader';
import MenuItem from '../components/MenuItem';
import './AuthPages.css'
import './LandingPage.css'

function LandingPage() {

    return (
        <div className="auth-root">
            <AuthHeader showAuth={true} />

            <div className="menu-container">
                <MenuItem name="JOIN LOBBY" />
                <MenuItem name="SETTINGS" />
                <MenuItem name="PROFILE" />
                <MenuItem name="MATCH HISTORY" />
            </div>

            <footer className="footer" />
        </div>
    )
}

export default LandingPage;