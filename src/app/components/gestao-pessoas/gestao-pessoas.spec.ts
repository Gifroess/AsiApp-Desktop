import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestaoPessoas } from './gestao-pessoas';

describe('GestaoPessoas', () => {
  let component: GestaoPessoas;
  let fixture: ComponentFixture<GestaoPessoas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestaoPessoas],
    }).compileComponents();

    fixture = TestBed.createComponent(GestaoPessoas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
