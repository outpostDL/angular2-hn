import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ItemDetailsComponent } from './item-details.component';
import { HackerNewsAPIService } from '../shared/services/hackernews-api.service';
import { SettingsService } from '../shared/services/settings.service';
import { Story } from '../shared/models/story';
import { CommentPipe } from '../shared/pipes/comment.pipe';

describe('ItemDetailsComponent', () => {
    let component: ItemDetailsComponent;
    let fixture: ComponentFixture<ItemDetailsComponent>;
    let mockHNService: jasmine.SpyObj<HackerNewsAPIService>;
    let mockLocation: jasmine.SpyObj<Location>;
    let mockSettingsService: any;
    let paramsSubject: BehaviorSubject<any>;

    beforeEach(async(() => {
        mockHNService = jasmine.createSpyObj('HackerNewsAPIService', ['fetchItemContent']);
        mockLocation = jasmine.createSpyObj('Location', ['back']);
        mockSettingsService = {
            settings: {
                showSettings: false,
                openLinkInNewTab: false,
                theme: 'default',
                titleFontSize: '16',
                listSpacing: '0',
            },
        };
        paramsSubject = new BehaviorSubject({ id: '123' });

        mockHNService.fetchItemContent.and.returnValue(of({} as Story));

        TestBed.configureTestingModule({
            declarations: [ItemDetailsComponent, CommentPipe],
            providers: [
                { provide: HackerNewsAPIService, useValue: mockHNService },
                { provide: Location, useValue: mockLocation },
                { provide: SettingsService, useValue: mockSettingsService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: paramsSubject.asObservable(),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemDetailsComponent);
        component = fixture.componentInstance;
        spyOn(window, 'scrollTo');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch item content by route param id on ngOnInit', () => {
        const mockStory: Story = { id: 123, title: 'Test', url: 'http://test.com' } as Story;
        mockHNService.fetchItemContent.and.returnValue(of(mockStory));
        fixture.detectChanges();

        expect(mockHNService.fetchItemContent).toHaveBeenCalledWith(123);
    });

    it('should set item on success', () => {
        const mockStory: Story = { id: 123, title: 'Test', url: 'http://test.com' } as Story;
        mockHNService.fetchItemContent.and.returnValue(of(mockStory));
        fixture.detectChanges();

        expect(component.item).toEqual(mockStory);
    });

    it('should set errorMessage on failure', () => {
        mockHNService.fetchItemContent.and.returnValue(throwError('Error'));
        fixture.detectChanges();

        expect(component.errorMessage).toBe('Could not load item comments.');
    });

    it('should return true for hasUrl when URL starts with http', () => {
        component.item = { url: 'http://example.com' } as Story;
        expect(component.hasUrl).toBe(true);
    });

    it('should return true for hasUrl when URL starts with https', () => {
        component.item = { url: 'https://example.com' } as Story;
        expect(component.hasUrl).toBe(true);
    });

    it('should return false for hasUrl for non-http URLs', () => {
        component.item = { url: 'item?id=123' } as Story;
        expect(component.hasUrl).toBe(false);
    });

    it('should call Location.back() on goBack', () => {
        component.goBack();
        expect(mockLocation.back).toHaveBeenCalled();
    });
});
