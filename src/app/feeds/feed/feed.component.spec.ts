import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { FeedComponent } from './feed.component';
import { HackerNewsAPIService } from '../../shared/services/hackernews-api.service';
import { Story } from '../../shared/models/story';

describe('FeedComponent', () => {
    let component: FeedComponent;
    let fixture: ComponentFixture<FeedComponent>;
    let mockHNService: jasmine.SpyObj<HackerNewsAPIService>;
    let paramsSubject: BehaviorSubject<any>;
    let dataSubject: BehaviorSubject<any>;

    beforeEach(async(() => {
        mockHNService = jasmine.createSpyObj('HackerNewsAPIService', ['fetchFeed']);
        paramsSubject = new BehaviorSubject({ page: '1' });
        dataSubject = new BehaviorSubject({ feedType: 'news' });

        mockHNService.fetchFeed.and.returnValue(of([]));

        TestBed.configureTestingModule({
            declarations: [FeedComponent],
            providers: [
                { provide: HackerNewsAPIService, useValue: mockHNService },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        data: dataSubject.asObservable(),
                        params: paramsSubject.asObservable(),
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedComponent);
        component = fixture.componentInstance;
        spyOn(window, 'scrollTo');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should subscribe to route data and set feedType', () => {
        fixture.detectChanges();
        expect(component.feedType).toBe('news');
    });

    it('should default pageNum to 1 when no route param', () => {
        paramsSubject.next({});
        fixture.detectChanges();
        expect(component.pageNum).toBe(1);
    });

    it('should set pageNum from route params', () => {
        paramsSubject.next({ page: '3' });
        fixture.detectChanges();
        expect(component.pageNum).toBe(3);
    });

    it('should call fetchFeed with correct feedType and page', () => {
        const mockItems: Story[] = [{ id: 1, title: 'Test' } as Story];
        mockHNService.fetchFeed.and.returnValue(of(mockItems));
        paramsSubject.next({ page: '2' });
        fixture.detectChanges();

        expect(mockHNService.fetchFeed).toHaveBeenCalledWith('news', 2);
    });

    it('should set items on success', () => {
        const mockItems: Story[] = [
            { id: 1, title: 'Story 1' } as Story,
            { id: 2, title: 'Story 2' } as Story,
        ];
        mockHNService.fetchFeed.and.returnValue(of(mockItems));
        fixture.detectChanges();

        expect(component.items).toEqual(mockItems);
    });

    it('should calculate listStart as (pageNum - 1) * 30 + 1', () => {
        mockHNService.fetchFeed.and.returnValue(of([]));
        paramsSubject.next({ page: '3' });
        fixture.detectChanges();

        expect(component.listStart).toBe(61);
    });

    it('should calculate listStart as 1 for page 1', () => {
        mockHNService.fetchFeed.and.returnValue(of([]));
        paramsSubject.next({ page: '1' });
        fixture.detectChanges();

        expect(component.listStart).toBe(1);
    });

    it('should set errorMessage on API error', () => {
        mockHNService.fetchFeed.and.returnValue(throwError('API Error'));
        fixture.detectChanges();

        expect(component.errorMessage).toBe('Could not load news stories.');
    });

    it('should set correct error message for different feed types', () => {
        mockHNService.fetchFeed.and.returnValue(throwError('API Error'));
        dataSubject.next({ feedType: 'ask' });
        paramsSubject.next({ page: '1' });
        fixture.detectChanges();

        expect(component.errorMessage).toBe('Could not load ask stories.');
    });
});
