import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ItemComponent } from './item.component';
import { SettingsService } from '../../shared/services/settings.service';
import { Story } from '../../shared/models/story';
import { CommentPipe } from '../../shared/pipes/comment.pipe';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;
    let mockSettingsService: any;

    beforeEach(async(() => {
        mockSettingsService = {
            settings: {
                showSettings: false,
                openLinkInNewTab: false,
                theme: 'default',
                titleFontSize: '16',
                listSpacing: '0',
            },
        };

        TestBed.configureTestingModule({
            declarations: [ItemComponent, CommentPipe],
            providers: [{ provide: SettingsService, useValue: mockSettingsService }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        component.item = {
            id: 1,
            title: 'Test Story',
            url: 'http://example.com',
            domain: 'example.com',
            points: 100,
            user: 'testuser',
            time_ago: 1,
            type: 'story',
            comments_count: 5,
        } as Story;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should receive @Input() item correctly', () => {
        fixture.detectChanges();
        expect(component.item.id).toBe(1);
        expect(component.item.title).toBe('Test Story');
    });

    it('should return true for hasUrl when item.url starts with http', () => {
        component.item = { url: 'http://example.com' } as Story;
        expect(component.hasUrl).toBe(true);
    });

    it('should return true for hasUrl when item.url starts with https', () => {
        component.item = { url: 'https://example.com' } as Story;
        expect(component.hasUrl).toBe(true);
    });

    it('should return false for hasUrl for other URLs', () => {
        component.item = { url: 'item?id=123' } as Story;
        expect(component.hasUrl).toBe(false);
    });

    it('should return false for hasUrl for empty URL', () => {
        component.item = { url: '' } as Story;
        expect(component.hasUrl).toBe(false);
    });

    it('should have settings reference from service', () => {
        expect(component.settings).toBe(mockSettingsService.settings);
    });
});
