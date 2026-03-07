import { NavLink, useLocation } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import Settings from '../Settings/Settings';
import './Header.scss';

function Header() {
    const { showSettings, toggleSettings } = useSettings();
    const location = useLocation();

    const scrollTop = () => {
        window.scrollTo(0, 0);
    };

    const isNavActive = (prefix: string) => {
        return location.pathname.startsWith(prefix);
    };

    return (
        <header>
            <div id="header">
                <NavLink className="home-link" to="/news/1" onClick={scrollTop}>
                    <div className="logo-inner"></div>
                    <img className="logo" src="/src/assets/images/logo.svg" alt="Logo" />
                </NavLink>
                <div className="header-text">
                    <div className="left">
                        <span className="header-nav">
                            <NavLink
                                to="/newest/1"
                                className={() => (isNavActive('/newest') ? 'active' : '')}
                                onClick={scrollTop}
                            >
                                new
                            </NavLink>
                            {' | '}
                            <NavLink
                                to="/show/1"
                                className={() => (isNavActive('/show') ? 'active' : '')}
                                onClick={scrollTop}
                            >
                                show
                            </NavLink>
                            {' | '}
                            <NavLink
                                to="/ask/1"
                                className={() => (isNavActive('/ask') ? 'active' : '')}
                                onClick={scrollTop}
                            >
                                ask
                            </NavLink>
                            {' | '}
                            <NavLink
                                to="/jobs/1"
                                className={() => (isNavActive('/jobs') ? 'active' : '')}
                                onClick={scrollTop}
                            >
                                jobs
                            </NavLink>
                        </span>
                    </div>
                </div>
                <div className="info">
                    <img
                        className="settings"
                        src="/src/assets/images/cog.svg"
                        alt="Settings"
                        onClick={toggleSettings}
                    />
                </div>
            </div>
            {showSettings && <Settings />}
        </header>
    );
}

export default Header;
