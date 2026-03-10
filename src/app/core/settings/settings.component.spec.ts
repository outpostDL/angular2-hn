import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../shared/services/settings.service';

describe('SettingsComponent', () => {
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;
    let mockSettingsService: jasmine.SpyObj<SettingsService>;

    beforeEach(async(() => {
        mockSettingsService = jasmine.createSpyObj('SettingsService', [
            'toggleSettings',
            'toggleOpenLinksInNewTab',
            'setTheme',
            'setFont',
            'setSpacing',
        ]);
        mockSettingsService.settings = {
            showSettings: true,
            openLinkInNewTab: false,
            theme: 'default',
            titleFontSize: '16',
            listSpacing: '0',
        };

        TestBed.configureTestingModule({
            declarations: [SettingsComponent],
            providers: [{ provide: SettingsService, useValue: mockSettingsService }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call settingsService.toggleSettings() on closeSettings', () => {
        component.closeSettings();
        expect(mockSettingsService.toggleSettings).toHaveBeenCalled();
    });

    it('should call settingsService.toggleOpenLinksInNewTab() on toggleOpenLinksInNewTab', () => {
        component.toggleOpenLinksInNewTab();
        expect(mockSettingsService.toggleOpenLinksInNewTab).toHaveBeenCalled();
    });

    it('should call settingsService.setTheme(theme) on selectTheme', () => {
        component.selectTheme('night');
        expect(mockSettingsService.setTheme).toHaveBeenCalledWith('night');
    });

    it('should call settingsService.setFont(val) on changeTitleFont', () => {
        component.changeTitleFont('20');
        expect(mockSettingsService.setFont).toHaveBeenCalledWith('20');
    });

    it('should call settingsService.setSpacing(val) on changeSpacing', () => {
        component.changeSpacing('10');
        expect(mockSettingsService.setSpacing).toHaveBeenCalledWith('10');
    });
});
