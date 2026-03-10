import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CommentComponent } from './comment.component';
import { Comment } from '../../shared/models/comment';

describe('CommentComponent', () => {
    let component: CommentComponent;
    let fixture: ComponentFixture<CommentComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CommentComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CommentComponent);
        component = fixture.componentInstance;
        component.comment = {
            id: 1,
            level: 0,
            user: 'testuser',
            time: 1234567890,
            time_ago: '2 hours ago',
            content: '<p>Test comment</p>',
            deleted: false,
            comments: [],
        } as Comment;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set collapse to false on ngOnInit', () => {
        fixture.detectChanges();
        expect(component.collapse).toBe(false);
    });

    it('should allow collapse to be toggled', () => {
        fixture.detectChanges();
        expect(component.collapse).toBe(false);
        component.collapse = true;
        expect(component.collapse).toBe(true);
        component.collapse = false;
        expect(component.collapse).toBe(false);
    });
});
