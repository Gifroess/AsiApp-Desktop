import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Home } from './home';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { AuthService } from '../../shared/services/auth';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Home, Sidebar],
      providers: [{ provide: AuthService, useValue: { getUserData: () => of(null) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('mantem o placeholder quando nao ha usuario', () => {
    expect(component.nomeMembro()).toBe('Nome do Membro');
  });

  it('atualiza o nome com o usuario logado', async () => {
    await TestBed.resetTestingModule()
      .configureTestingModule({
        declarations: [Home, Sidebar],
        providers: [
          { provide: AuthService, useValue: { getUserData: () => of({ name: 'Miguel' }) } },
        ],
      })
      .compileComponents();
    const f = TestBed.createComponent(Home);
    expect(f.componentInstance.nomeMembro()).toBe('Miguel');
  });

  it('calcula o percentual de faturamento', () => {
    component.faturamento = { alcancado: 50, meta: 200 };
    expect(component.faturamentoPct).toBe(25);
  });

  it('nao quebra com meta zero', () => {
    component.faturamento = { alcancado: 10, meta: 0 };
    expect(component.faturamentoPct).toBe(0);
  });

  it('formata valores em BRL', () => {
    const formatado = component.formatBRL(1234.5).replace(/\s/g, ' ');
    expect(formatado).toContain('R$');
    expect(formatado).toContain('1.234,50');
  });
});
