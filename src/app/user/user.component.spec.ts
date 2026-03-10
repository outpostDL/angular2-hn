import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { UserComponent } from './user.component';
import { HackerNewsAPIService } from '../shared/services/hackernews-api.service';
import { User } from '../shared/models/user';

describe('UserComponent', () => {
    let component: UserComponent;
    let fixture: ComponentFixture<UserComponent>;
    let mockHNService: jasmine.SpyObj<HackerNewsAPIService>;
    let mockLocation: jasmine.SpyObj<Location>;
    let paramsSubject: BehaviorSubject<any>;

    beforeEach(async(() => {
        mockHNService = jasmine.createSpyObj('HackerNewsAPIService', ['fetchUser']);
        mockLocation = jasmine.createSpyObj('Location', ['back']);
        paramsSubject = new BehaviorSubject({ id: 'pg' });

        mockHNService.fetchUser.and.returnValue(of({} as User));

        TestBed.configureTestingModule({
            declarations: [UserComponent],
            providers: [
                { provide: HackerNewsAPIService, useValue: mockHNService },
                { provide: Location, useValue: mockLocation },
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
        fixture = TestBed.createComponent(UserComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch user by route param id on ngOnInit', () => {
        const mockUser: User = { id: 'pg', karma: 1000 } as User;
        mockHNService.fetchUser.and.returnValue(of(mockUser));
        fixture.detectChanges();

        expect(mockHNService.fetchUser).toHaveBeenCalledWith('pg');
    });

    it('should set user on success', () => {
        const mockUser: User = { id: 'pg', karma: 1000 } as User;
        mockHNService.fetchUser.and.returnValue(of(mockUser));
        fixture.detectChanges();

        expect(component.user).toEqual(mockUser);
    });

    it('should set errorMessage on failure with user ID in message', () => {
        mockHNService.fetchUser.and.returnValue(throwError('Error'));
        fixture.detectChanges();

        expect(component.errorMessage).toBe('Could not load user pg.');
    });

    it('should include different user ID in error message', () => {
        paramsSubject.next({ id: 'dang' });
        mockHNService.fetchUser.and.returnValue(throwError('Error'));
        fixture.detectChanges();

        expect(component.errorMessage).toBe('Could not load user dang.');
    });

    it('should call Location.back() on goBack', () => {
        component.goBack();
        expect(mockLocation.back).toHaveBeenCalled();
    });
});
