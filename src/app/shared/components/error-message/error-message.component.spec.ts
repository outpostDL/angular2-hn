import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorMessageComponent } from './error-message.component';

describe('ErrorMessageComponent', () => {
    let component: ErrorMessageComponent;
    let fixture: ComponentFixture<ErrorMessageComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorMessageComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorMessageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render input message', () => {
        component.message = 'Something went wrong';
        fixture.detectChanges();

        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.strong').textContent).toContain('Something went wrong');
    });

    it('should update when message changes', () => {
        component.message = 'First error';
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.strong').textContent).toContain('First error');

        component.message = 'Second error';
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.strong').textContent).toContain('Second error');
    });
});
