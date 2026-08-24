export interface UserInterface {
    name: string;
    email: string;
    cargo: 'Membro' | 'Gerente' | 'Vice-Presidente' | 'Diretor' | 'Presidente'; 
    status: 'Ativo' | 'Inativo';
}