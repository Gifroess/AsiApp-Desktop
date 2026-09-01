import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestaoProjetos } from './gestao-projetos';

describe('GestaoProjetos', () => {
  let component: GestaoProjetos;
  let fixture: ComponentFixture<GestaoProjetos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestaoProjetos],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoProjetos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
