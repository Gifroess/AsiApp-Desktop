import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Sidebar],
      imports: [RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marca Home como ativo via paginaAtiva', () => {
    fixture.componentRef.setInput('paginaAtiva', 'home');
    fixture.detectChanges();
    const home: HTMLElement = fixture.nativeElement.querySelector('a[routerLink="/home"]');
    expect(home.classList).toContain('ativo');
  });
});
