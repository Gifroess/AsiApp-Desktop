import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { VerificarEmail } from './verificar-email';
import { AuthService } from '../../shared/services/auth';

describe('VerificarEmail', () => {
  let component: VerificarEmail;
  let fixture: ComponentFixture<VerificarEmail>;
  let reenviarVerificacao: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    reenviarVerificacao = vi.fn().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      declarations: [VerificarEmail],
      imports: [ReactiveFormsModule, RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: { reenviarVerificacao } }],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificarEmail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('não reenvia com formulário inválido', async () => {
    await component.reenviar();
    expect(reenviarVerificacao).not.toHaveBeenCalled();
  });

  it('reenvia e mostra sucesso quando o formulário é válido', async () => {
    component.form.setValue({ email: 'a@asimovjr.com.br', senha: 'segredo123' });
    await component.reenviar();
    expect(reenviarVerificacao).toHaveBeenCalledWith('a@asimovjr.com.br', 'segredo123');
    expect(component.mensagemSucesso()).toContain('reenviado');
  });

  it('mostra erro amigável quando as credenciais são inválidas', async () => {
    reenviarVerificacao.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    component.form.setValue({ email: 'a@asimovjr.com.br', senha: 'errada' });
    await component.reenviar();
    expect(component.mensagemErro()).toBe('E-mail ou senha incorretos.');
  });
});
