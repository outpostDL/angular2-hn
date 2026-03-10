import { TestBed, async } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { SettingsService } from './shared/services/settings.service';

describe('AppComponent', () => {
    let component: AppComponent;
    let routerEventsSubject: Subject<any>;
    let mockSettingsService: any;
    let mockRouter: any;
    let gaSpy: jasmine.Spy;

    beforeEach(async(() => {
        routerEventsSubject = new Subject();
        mockSettingsService = {
            settings: {
                showSettings: false,
                openLinkInNewTab: false,
                theme: 'default',
                titleFontSize: '16',
                listSpacing: '0',
            },
        };
        mockRouter = {
            events: routerEventsSubject.asObservable(),
        };

        // Mock the global ga function
        gaSpy = jasmine.createSpy('ga');
        (window as any).ga = gaSpy;

        TestBed.configureTestingModule({
            declarations: [AppComponent],
            providers: [
                { provide: SettingsService, useValue: mockSettingsService },
                { provide: Router, useValue: mockRouter },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    afterEach(() => {
        delete (window as any).ga;
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });

    it('should have settings reference from service', () => {
        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        expect(component.settings).toBe(mockSettingsService.settings);
    });

    it('should call ga on NavigationEnd event', () => {
        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        const navEnd = new NavigationEnd(1, '/news/1', '/news/1');
        routerEventsSubject.next(navEnd);

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/news/1');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');
    });

    it('should not call ga for non-NavigationEnd events', () => {
        const fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        gaSpy.calls.reset();
        routerEventsSubject.next({ id: 1, url: '/test' }); // Not a NavigationEnd

        expect(gaSpy).not.toHaveBeenCalled();
    });
});
