import { SettingsService } from './settings.service';

describe('SettingsService', () => {
    let service: SettingsService;
    let localStorageSpy: {
        getItem: jasmine.Spy;
        setItem: jasmine.Spy;
    };
    let matchMediaSpy: jasmine.Spy;
    let mockMediaQueryList: any;

    beforeEach(() => {
        // Mock localStorage
        localStorageSpy = {
            getItem: jasmine.createSpy('getItem').and.returnValue(null),
            setItem: jasmine.createSpy('setItem'),
        };
        spyOn(localStorage, 'getItem').and.callFake(localStorageSpy.getItem);
        spyOn(localStorage, 'setItem').and.callFake(localStorageSpy.setItem);

        // Mock matchMedia
        mockMediaQueryList = {
            matches: false,
            media: '(prefers-color-scheme: dark)',
            addEventListener: jasmine.createSpy('addEventListener'),
            removeEventListener: jasmine.createSpy('removeEventListener'),
            dispatchEvent: jasmine.createSpy('dispatchEvent'),
        };
        matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue(mockMediaQueryList);

        service = new SettingsService();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('constructor defaults', () => {
        it('should initialize defaults when localStorage is empty', () => {
            expect(service.settings.showSettings).toBe(false);
            expect(service.settings.openLinkInNewTab).toBe(false);
            expect(service.settings.titleFontSize).toBe('16');
            expect(service.settings.listSpacing).toBe('0');
        });
    });

    describe('constructor with persisted values', () => {
        it('should read persisted values from localStorage', () => {
            // Reset and re-create with values in localStorage
            (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
                const store: Record<string, string> = {
                    openLinkInNewTab: 'true',
                    titleFontSize: '20',
                    listSpacing: '5',
                    theme: 'night',
                };
                return store[key] || null;
            });

            const serviceWithPersistedValues = new SettingsService();
            expect(serviceWithPersistedValues.settings.openLinkInNewTab).toBe(true);
            expect(serviceWithPersistedValues.settings.titleFontSize).toBe('20');
            expect(serviceWithPersistedValues.settings.listSpacing).toBe('5');
        });
    });

    describe('initTheme', () => {
        it('should use saved theme from localStorage if present', () => {
            (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
                if (key === 'theme') { return 'amoledblack'; }
                return null;
            });

            const serviceWithTheme = new SettingsService();
            expect(serviceWithTheme.settings.theme).toBe('amoledblack');
        });

        it('should dispatch media query event when no saved theme', () => {
            // Default setup has no saved theme - initTheme should dispatch event
            expect(mockMediaQueryList.dispatchEvent).toHaveBeenCalled();
        });
    });

    describe('handleSystemPreferredColorSchemeChange', () => {
        it('should set night theme when matches is true', () => {
            const event = { matches: true } as MediaQueryListEvent;
            service.handleSystemPreferredColorSchemeChange(event);
            expect(service.settings.theme).toBe('night');
        });

        it('should set default theme when matches is false', () => {
            service.settings.theme = 'night'; // Start with night
            const event = { matches: false } as MediaQueryListEvent;
            service.handleSystemPreferredColorSchemeChange(event);
            expect(service.settings.theme).toBe('default');
        });
    });

    describe('toggleSettings', () => {
        it('should flip showSettings', () => {
            expect(service.settings.showSettings).toBe(false);
            service.toggleSettings();
            expect(service.settings.showSettings).toBe(true);
            service.toggleSettings();
            expect(service.settings.showSettings).toBe(false);
        });
    });

    describe('toggleOpenLinksInNewTab', () => {
        it('should flip boolean and persist to localStorage', () => {
            expect(service.settings.openLinkInNewTab).toBe(false);
            service.toggleOpenLinksInNewTab();
            expect(service.settings.openLinkInNewTab).toBe(true);
            expect(localStorage.setItem).toHaveBeenCalledWith('openLinkInNewTab', 'true');

            service.toggleOpenLinksInNewTab();
            expect(service.settings.openLinkInNewTab).toBe(false);
            expect(localStorage.setItem).toHaveBeenCalledWith('openLinkInNewTab', 'false');
        });
    });

    describe('setTheme', () => {
        it('should update settings and persist', () => {
            service.setTheme('night');
            expect(service.settings.theme).toBe('night');
            expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'night');
        });
    });

    describe('setFont', () => {
        it('should update settings and persist', () => {
            service.setFont('20');
            expect(service.settings.titleFontSize).toBe('20');
            expect(localStorage.setItem).toHaveBeenCalledWith('titleFontSize', '20');
        });
    });

    describe('setSpacing', () => {
        it('should update settings and persist', () => {
            service.setSpacing('10');
            expect(service.settings.listSpacing).toBe('10');
            expect(localStorage.setItem).toHaveBeenCalledWith('listSpacing', '10');
        });
    });
});
