export type UserRole =
    | 'Aguardando atribuição'
    | 'Membro'
    | 'Gerência'
    | 'Vice-Presidência'
    | 'Diretoria'
    | 'Presidência'
    | 'Administrador';

export interface UserInterface {
    name: string;
    email: string;
    role: UserRole;
    fotoUrl?: string;
}
