import { Location } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { EventoService } from '../../shared/services/evento.service';
import { AutorPostagem, PostagemFirebase, PostagemService } from '../../shared/services/postagem.service';

interface AreaCalendario {
  nome: string;
  cor: string;
}

interface DiaCalendario {
  data: Date;
  numero: number;
  mesAtual: boolean;
  hoje: boolean;
  selecionado: boolean;
}

interface EventoLista {
  id?: string;
  titulo: string;
  horario: string;
  data: Date;
  areas: string[];
}

interface PostagemLista extends PostagemFirebase {
  id: string;
}

@Component({
  selector: 'app-menu-postagem',
  standalone: false,
  templateUrl: './menu-postagem.html',
  styleUrl: './menu-postagem.scss'
})
export class MenuPostagem {
  private hoje = new Date();
  private autorAtual: AutorPostagem | null = null;

  abaAtiva = signal<'calendario' | 'feed'>('calendario');
  mesExibido = signal(new Date(this.hoje.getFullYear(), this.hoje.getMonth(), 1));
  dataSelecionada = signal(new Date());
  seletorAreasAberto = signal(false);
  areasSelecionadas = signal<string[]>([]);
  nomeEvento = signal('');
  horarioDigitado = signal('');
  eventos = signal<EventoLista[]>([]);
  eventoEditando = signal<string | null>(null);

  postagens = signal<PostagemLista[]>([]);
  usuarioAtualUid = signal('');
  textoPost = signal('');
  imagemSelecionada = signal<File | null>(null);
  imagemPreview = signal<string | null>(null);
  publicando = signal(false);

  diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

  areas: AreaCalendario[] = [
    { nome: 'Geral', cor: '#171c35' },
    { nome: 'Ciência de Dados', cor: '#654542' },
    { nome: 'Desktop', cor: '#7c6cf2' },
    { nome: 'Mobile', cor: '#bf4fd8' },
    { nome: 'Sites', cor: '#a52d31' },
    { nome: 'Marketing e Design', cor: '#ff4147' },
    { nome: 'Vendas', cor: '#ffb52c' },
    { nome: 'Presidência', cor: '#48bfe6' },
    { nome: 'Recursos Humanos', cor: '#e766bf' },
    { nome: 'Vice-Presidência', cor: '#f45485' },
    { nome: 'Estratégia e Qualidade', cor: '#8b2ce1' },
    { nome: 'Outros', cor: '#a8aab6' }
  ];

  nomeMes = computed(() =>
    this.mesExibido().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  );

  dataSelecionadaFormatada = computed(() =>
    this.dataSelecionada().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  );

  dataSelecionadaInput = computed(() => {
    const data = this.dataSelecionada();
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  });

  textoAreaSelecionada = computed(() => {
    const areas = this.areasSelecionadas();

    if (!areas.length) return 'Selecione uma área';
    if (areas.length === 1) return areas[0];

    return `${areas.length} áreas selecionadas`;
  });

  diasCalendario = computed(() => this.gerarDiasCalendario());

  eventosDoDia = computed(() =>
    this.eventos().filter(evento => this.mesmaData(evento.data, this.dataSelecionada()))
  );

  constructor(
    private location: Location,
    private eventoService: EventoService,
    private postagemService: PostagemService
  ) {
    this.carregarEventos();
    this.carregarPostagens();
    this.carregarUsuarioAtual();
  }

  abrirFeed(): void {
    this.seletorAreasAberto.set(false);
    this.abaAtiva.set('feed');
  }

  abrirCalendario(): void {
    this.abaAtiva.set('calendario');
  }

  carregarEventos(): void {
    this.eventoService.listarEventos().subscribe(eventos => {
      this.eventos.set(
        eventos.map(evento => ({
          id: evento.id,
          titulo: evento.titulo,
          horario: evento.horario,
          data: evento.data instanceof Date ? evento.data : evento.data.toDate(),
          areas: evento.areas
        }))
      );
    });
  }

  private carregarUsuarioAtual(): void {
    this.postagemService.obterAutorAtual()
      .then(autor => {
        this.autorAtual = autor;
        this.usuarioAtualUid.set(autor.uid);
      })
      .catch(erro => console.error('Erro ao carregar usuário:', erro));
  }

  private carregarPostagens(): void {
    this.postagemService.listarPostagens().subscribe(postagens => {
      const lista = postagens
        .filter(post => !!post.id)
        .map(post => ({
          ...post,
          id: post.id!,
          curtidoPor: Array.isArray(post.curtidoPor) ? post.curtidoPor : [],
          repostadoPor: Array.isArray(post.repostadoPor) ? post.repostadoPor : [],
          imagemUrl: post.imagemUrl ?? null,
          fotoAutorUrl: post.fotoAutorUrl ?? null
        }))
        .sort((a, b) =>
          this.timestampEmMilissegundos(b.dataCriacao) -
          this.timestampEmMilissegundos(a.dataCriacao)
        );

      this.postagens.set(lista);
    });
  }

  atualizarTextoPost(valor: string): void {
    this.textoPost.set(valor);
  }

  selecionarImagem(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem.');
      input.value = '';
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5 MB.');
      input.value = '';
      return;
    }

    this.imagemSelecionada.set(arquivo);

    const leitor = new FileReader();
    leitor.onload = () => this.imagemPreview.set(leitor.result as string);
    leitor.readAsDataURL(arquivo);
  }

  removerImagem(): void {
    this.imagemSelecionada.set(null);
    this.imagemPreview.set(null);
  }

  async publicarPost(): Promise<void> {
    const texto = this.textoPost().trim();
    const imagem = this.imagemSelecionada();

    if (!texto && !imagem) {
      alert('Escreva alguma coisa ou adicione uma imagem.');
      return;
    }

    this.publicando.set(true);

    try {
      if (!this.autorAtual) {
        this.autorAtual = await this.postagemService.obterAutorAtual();
        this.usuarioAtualUid.set(this.autorAtual.uid);
      }

      const imagemUrl = imagem
        ? await this.postagemService.enviarImagem(imagem, this.autorAtual.uid)
        : null;

      await this.postagemService.publicarPost(texto, imagemUrl, this.autorAtual);

      this.textoPost.set('');
      this.removerImagem();
    } catch (erro) {
      console.error('Erro ao publicar postagem:', erro);
      alert('Não foi possível publicar agora. Confira o console para mais detalhes.');
    } finally {
      this.publicando.set(false);
    }
  }

  alternarCurtida(post: PostagemLista): void {
    const uid = this.usuarioAtualUid();
    if (!uid) return;

    const jaCurtiu = post.curtidoPor.includes(uid);

    this.postagemService.alterarCurtida(post.id, uid, jaCurtiu)
      .catch(erro => console.error('Erro ao curtir postagem:', erro));
  }

  alternarRepost(post: PostagemLista): void {
    const uid = this.usuarioAtualUid();
    if (!uid) return;

    const jaRepostou = post.repostadoPor.includes(uid);

    this.postagemService.alterarRepost(post.id, uid, jaRepostou)
      .catch(erro => console.error('Erro ao repostar:', erro));
  }

  postCurtido(post: PostagemLista): boolean {
    return !!this.usuarioAtualUid() && post.curtidoPor.includes(this.usuarioAtualUid());
  }

  postRepostado(post: PostagemLista): boolean {
    return !!this.usuarioAtualUid() && post.repostadoPor.includes(this.usuarioAtualUid());
  }

  inicialAutor(nome: string): string {
    return nome?.trim().charAt(0).toUpperCase() || '?';
  }

  private timestampEmMilissegundos(data: any): number {
    if (!data) return 0;
    if (data instanceof Date) return data.getTime();
    if (typeof data.toDate === 'function') return data.toDate().getTime();

    return 0;
  }

  adicionarEvento(): void {
    if (!this.nomeEvento() || !this.horarioDigitado() || !this.areasSelecionadas().length) {
      alert('Preencha todos os campos do evento.');
      return;
    }

    const evento = {
      titulo: this.nomeEvento(),
      horario: this.horarioDigitado(),
      data: this.dataSelecionada(),
      areas: this.areasSelecionadas()
    };

    const id = this.eventoEditando();

    if (id) {
      this.eventoService.atualizarEvento(id, evento)
        .then(() => this.limparFormulario())
        .catch(erro => console.error('Erro ao atualizar evento:', erro));

      return;
    }

    this.eventoService.adicionarEvento(evento)
      .then(() => this.limparFormulario())
      .catch(erro => console.error('Erro ao adicionar evento:', erro));
  }

  editarEvento(evento: EventoLista): void {
    this.nomeEvento.set(evento.titulo);
    this.horarioDigitado.set(evento.horario);
    this.areasSelecionadas.set(evento.areas);
    this.dataSelecionada.set(evento.data);
    this.eventoEditando.set(evento.id ?? null);
  }

  excluirEvento(id?: string): void {
    if (!id) return;

    this.eventoService.excluirEvento(id)
      .catch(erro => console.error('Erro ao excluir evento:', erro));
  }

  limparFormulario(): void {
    this.nomeEvento.set('');
    this.horarioDigitado.set('');
    this.areasSelecionadas.set([]);
    this.eventoEditando.set(null);
    this.seletorAreasAberto.set(false);
  }

  gerarDiasCalendario(): DiaCalendario[] {
    const mes = this.mesExibido();
    const selecionada = this.dataSelecionada();
    const ano = mes.getFullYear();
    const numeroMes = mes.getMonth();

    const primeiroDia = new Date(ano, numeroMes, 1);
    const ultimoDia = new Date(ano, numeroMes + 1, 0);
    const diasAntes = (primeiroDia.getDay() + 6) % 7;
    const totalDias = diasAntes + ultimoDia.getDate();
    const totalCelulas = Math.ceil(totalDias / 7) * 7;

    return Array.from({ length: totalCelulas }, (_, indice) => {
      const data = new Date(ano, numeroMes, indice - diasAntes + 1);

      return {
        data,
        numero: data.getDate(),
        mesAtual: data.getMonth() === numeroMes,
        hoje: this.mesmaData(data, this.hoje),
        selecionado: this.mesmaData(data, selecionada)
      };
    });
  }

  selecionarDia(dia: DiaCalendario): void {
    this.dataSelecionada.set(dia.data);

    if (!dia.mesAtual) {
      this.mesExibido.set(new Date(dia.data.getFullYear(), dia.data.getMonth(), 1));
    }
  }

  selecionarDataInput(valor: string): void {
    const [ano, mes, dia] = valor.split('-').map(Number);

    if (!ano || !mes || !dia) return;

    const data = new Date(ano, mes - 1, dia);
    this.dataSelecionada.set(data);
    this.mesExibido.set(new Date(ano, mes - 1, 1));
  }

  atualizarNomeEvento(valor: string): void {
    this.nomeEvento.set(valor);
  }

  alternarSeletorAreas(): void {
    this.seletorAreasAberto.update(valor => !valor);
  }

  selecionarArea(area: string): void {
    this.areasSelecionadas.update(lista =>
      lista.includes(area)
        ? lista.filter(item => item !== area)
        : [...lista, area]
    );
  }

  areaSelecionada(area: string): boolean {
    return this.areasSelecionadas().includes(area);
  }

  corArea(area: string): string {
    return this.areas.find(item => item.nome === area)?.cor ?? '#a8aab6';
  }

  diaPossuiEvento(data: Date): boolean {
    return this.eventos().some(evento => this.mesmaData(evento.data, data));
  }

  corDiaEvento(data: Date): string {
    const evento = this.eventos().find(item => this.mesmaData(item.data, data));

    return evento
      ? this.corArea(evento.areas[0])
      : 'transparent';
  }

  mesAnterior(): void {
    const mes = this.mesExibido();
    this.mesExibido.set(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));
  }

  proximoMes(): void {
    const mes = this.mesExibido();
    this.mesExibido.set(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
  }

  formatarHorario(input: HTMLInputElement): void {
    let numeros = input.value.replace(/\D/g, '').slice(0, 4);

    if (numeros.length > 2) {
      numeros = `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
    }

    input.value = numeros;
    this.horarioDigitado.set(numeros);
  }

  mesmaData(dataA: Date, dataB: Date): boolean {
    return dataA.getFullYear() === dataB.getFullYear()
      && dataA.getMonth() === dataB.getMonth()
      && dataA.getDate() === dataB.getDate();
  }

  voltar(): void {
    this.location.back();
  }
}