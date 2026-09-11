import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';

import { AuthService } from '../../shared/services/auth';

export const financeiroGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUserData().pipe(
    take(1),
    map(usuario => {
      const podeAcessar =
        usuario?.role === 'Presidência' ||
        usuario?.role === 'Diretoria';

      return podeAcessar
        ? true
        : router.createUrlTree(['/home']);
    })
  );
};