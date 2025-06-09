import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickAddModalComponent } from './quick-add-modal.component';

describe('QuickAddModalComponent', () => {
  let component: QuickAddModalComponent;
  let fixture: ComponentFixture<QuickAddModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickAddModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickAddModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
