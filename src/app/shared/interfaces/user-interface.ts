export interface UserInterface {
    name: string;
    email: string;
    role: 'Aguardando atribuição' | 'Membro' | 'Gerência' | 'Vice-Presidência' | 'Diretoria' | 'Presidência' | 'Administrador';
    status: 'Ativo' | 'Inativo';
    fotoUrl?: string;
}