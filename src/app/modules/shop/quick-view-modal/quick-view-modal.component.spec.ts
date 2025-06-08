import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickViewModalComponent } from './quick-view-modal.component';

describe('QuickViewModalComponent', () => {
  let component: QuickViewModalComponent;
  let fixture: ComponentFixture<QuickViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickViewModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
