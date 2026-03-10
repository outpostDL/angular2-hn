import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { HeaderComponent } from './header.component';
import { SettingsService } from '../../shared/services/settings.service';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let mockSettingsService: jasmine.SpyObj<SettingsService>;
    let sharedSettings: any;

    beforeEach(async(() => {
        sharedSettings = {
            showSettings: false,
            openLinkInNewTab: false,
            theme: 'default',
            titleFontSize: '16',
            listSpacing: '0',
        };
        mockSettingsService = jasmine.createSpyObj('SettingsService', ['toggleSettings']);
        mockSettingsService.settings = sharedSettings;

        TestBed.configureTestingModule({
            declarations: [HeaderComponent],
            providers: [{ provide: SettingsService, useValue: mockSettingsService }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should delegate toggleSettings to service', () => {
        component.toggleSettings();
        expect(mockSettingsService.toggleSettings).toHaveBeenCalled();
    });

    it('should have settings as shared reference from service', () => {
        expect(component.settings).toBe(sharedSettings);
    });
});
