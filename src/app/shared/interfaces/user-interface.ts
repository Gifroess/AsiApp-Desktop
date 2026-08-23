export interface UserInterface {
    name: string;
    email: string;
    cargo: 'Membro' | 'Gerente' | 'Diretor' | 'Presidência' | 'Vice-Presidência';
    status: 'Ativo' | 'Inativo';
}