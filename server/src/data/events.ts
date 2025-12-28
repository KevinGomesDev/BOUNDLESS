export interface EventDef {
  id: number;
  name: string;
  successEffect: string;
}

const RAW_TEXT = `
O Kevin — 07/04/2024 23:01domingo, 7 de abril de 2024 23:01
01° - Nome do Evento: Despertar do Guardião do Território
Efeito de Sucesso: Ao obter sucesso na rolagem de História, as Unidades descobrem a história e o segredo do guardião ancestral do território. Isso leva ao seu despertar benevolente. O guardião se torna um aliado do Reino que comandar aquele Território. Em Batalhas que acontecerem lá, o guardião virá ao auxilio dos seus aliados. O Guardião é uma Criatura aleatória de nível 10. (editado)segunda-feira, 29 de abril de 2024 08:55
[23:06]domingo, 7 de abril de 2024 23:06
02° - Nome do Evento: Descoberta da Caverna dos Cristais
Efeito de Sucesso: Ao explorar a Caverna dos Cristais com sucesso, as Unidades descobrem cristais mágicos raros que podem ser utilizados para aprimorar a magia do reino. Cada Produtor de Arcana nesse Território conta como dois. (editado)sexta-feira, 3 de maio de 2024 01:57
[23:08]domingo, 7 de abril de 2024 23:08
03º - Nome do Evento: Despertar da Árvore Anciã
Efeito de Sucesso: Ao despertar a Árvore Anciã com sucesso, as Unidades recebem sua bênção sagrada, concedendo um buff permanente a Unidade responsável. Essa Unidade regenera 1 de Vitalidade por turno em Batalhas, contanto que esteja acima de 0 de Vitalidade. (editado)segunda-feira, 29 de abril de 2024 08:55
O Kevin — 07/04/2024 23:11domingo, 7 de abril de 2024 23:11
04º - Nome do Evento: O Encontro com o Guardião das Sombras
Efeito de Sucesso: Ao lidar com sucesso com o Guardião das Sombras, as Unidades ganham conhecimento arcano valioso que pode ser usado para fortalecer sua magia. A Unidade que realizou o Evento pode conjurar uma Magia a escolha dela, uma vez por Batalha, sem custo. (editado)segunda-feira, 29 de abril de 2024 08:55
[23:13]domingo, 7 de abril de 2024 23:13
05º - Nome do Evento: O Desafio do Labirinto Antigo
Efeito de Sucesso: Ao superar o Desafio do Labirinto Antigo, as Unidades desvendam segredos arcanos e recebem a bênção dos antigos guardiões do território. Esse Território recebe um Posto extra gratuitamente. (editado)segunda-feira, 29 de abril de 2024 08:55
[23:15]domingo, 7 de abril de 2024 23:15
06º - Nome do Evento: O Despertar da Maldição Ancestral
Efeito de Sucesso: Ao lidar com sucesso com a Maldição Ancestral, as Unidades desvendam os segredos para dissipar a maldição que assola o território. Cada Produtor de Minério nesse Território conta como dois. (editado)sexta-feira, 3 de maio de 2024 01:49
[23:17]domingo, 7 de abril de 2024 23:17
07º - Nome do Evento: O Despertar do Guardião Elemental
Efeito de Sucesso: Ao lidar com sucesso com o Guardião Elemental, as Unidades ganham a lealdade e a proteção do espírito elemental. Você recebe gratuitamente uma Criatura de Nível 10, que é considerado uma Tropa de todas as Categorias para você. (editado)domingo, 28 de abril de 2024 19:20
O Kevin — 07/04/2024 23:20domingo, 7 de abril de 2024 23:20
08º - Nome do Evento: A Descoberta do Poço da Sabedoria
Efeito de Sucesso: Ao descobrir o Poço da Sabedoria, as Unidades ganham insights valiosos sobre estratégias de governança e administração. A Unidade responsável se torna uma estrategista nata. Ela sempre será a primeira a agir em uma Batalha. (editado)domingo, 28 de abril de 2024 19:20
[23:22]domingo, 7 de abril de 2024 23:22
09º - Nome do Evento: O Desafio da Caverna do Dragão
Efeito de Sucesso: Ao superar o Desafio da Caverna do Dragão, as Unidades conquistam a confiança do dragão guardião, que concorda em se tornar aliado do reino. Você recebe gratuitamente uma Criatura de Nível 10, que é considerado uma Tropa de todas as Categorias para você. (editado)domingo, 28 de abril de 2024 19:20
[23:24]domingo, 7 de abril de 2024 23:24
10° - Nome do Evento: A Descoberta da Fonte da Vida
Efeito de Sucesso: Ao descobrir a Fonte da Vida, as Unidades ganham conhecimento sobre práticas de cura e renovação espiritual. Toda cura recebida pela Unidade responsável é dobrada. (editado)domingo, 28 de abril de 2024 19:20
O Kevin — 07/04/2024 23:34domingo, 7 de abril de 2024 23:34
11° - Nome do Evento: A Prova dos Três Portais
Efeito de Sucesso: Ao superar a Prova dos Três Portais, as Unidades ganham acesso a conhecimentos arcanos antigos e a alianças com seres extraplanares. Você recebe uma Tropa aleatória gratuitamente. (editado)domingo, 28 de abril de 2024 19:20
[23:36]domingo, 7 de abril de 2024 23:36
12° - Nome do Evento: A Despertar do Guardião da Floresta Antiga
Efeito de Sucesso: Ao despertar o Guardião da Floresta Antiga, as Unidades ganham o respeito e a proteção das criaturas da floresta. Token de Suprimento nesse Território contam como dois. (editado)domingo, 28 de abril de 2024 22:33
O Kevin — 07/04/2024 23:42domingo, 7 de abril de 2024 23:42
13° - Nome do Evento: O Desafio do Vale das Sombras
Efeito de Sucesso: Ao superar o Desafio do Vale das Sombras, as Unidades ganham o conhecimento secreto de rotas seguras e esconderijos estratégicos. A Unidade responsável pode usar a ação de Fuga em troca de seu movimento, e possui sucesso automático nos testes de Fuga. (editado)domingo, 28 de abril de 2024 22:33
[23:45]domingo, 7 de abril de 2024 23:45
14° - Nome do Evento: O Enigma do Templo Esquecido
Efeito de Sucesso: Ao decifrar o Enigma do Templo Esquecido, as Unidades ganham a benção dos deuses antigos e o conhecimento de técnicas sagradas perdidas. A Unidade está permanentemente emitindo uma aura de 3 quadrados. Ela, e todos os aliados que estiverem dentro da área, recebem +1D em Testes Resistidos em Batalhas. (editado)domingo, 28 de abril de 2024 22:33
[23:47]domingo, 7 de abril de 2024 23:47
15° - Nome do Evento: A Prova da Alma Perdida
Efeito de Sucesso: Ao completar a Prova da Alma Perdida, as Unidades ganham o conhecimento sobre a localização de artefatos poderosos. A Unidade encontra um Equipamento Mágico aleatório. (editado)domingo, 28 de abril de 2024 22:33
O Kevin — 07/04/2024 23:51domingo, 7 de abril de 2024 23:51
16° - Nome do Evento: A Jornada do Guardião Celestial
Efeito de Sucesso: Ao completar a Jornada do Guardião Celestial, as Unidades recebem a bênção de uma entidade celestial, ganhando proteção divina e sabedoria sagrada. A Unidade responsável recebe permanentemente +2D em todos os Testes Resistidos. (editado)domingo, 28 de abril de 2024 22:33
10 de abril de 2024
O Kevin — 10/04/2024 00:52quarta-feira, 10 de abril de 2024 00:52
17º - Nome do Evento: A Prova do Renascimento
Efeito de Sucesso: Ao passar pela Prova do Renascimento com sucesso, a Unidade é elevada a um novo patamar de existência. Ela Ascende, recebendo uma Passiva de Raça extra aleatória. Além disso, se a Unidade for um Herói, passa a ser um Regente, e se for um Regente, dobra o atributo de Vitalidade. (editado)domingo, 28 de abril de 2024 18:00
[00:55]quarta-feira, 10 de abril de 2024 00:55
18º - Nome do Evento: O Despertar da Colina Sagrada
Efeito de Sucesso: Ao despertar a Colina Sagrada com sucesso, as Unidades são abençoadas pelos espíritos naturais da região. Ela recebe uma Capa Mágica. (editado)domingo, 28 de abril de 2024 18:00
[00:57]quarta-feira, 10 de abril de 2024 00:57
19º - Nome do Evento: A Expedição à Cidade Submersa
Efeito de Sucesso: Ao explorar com sucesso a Cidade Submersa, as Unidades encontram artefatos ancestrais e tesouros subaquáticos. Ela recebe um Foco Arcano Mágico. (editado)domingo, 28 de abril de 2024 18:00
O Kevin — 10/04/2024 00:59quarta-feira, 10 de abril de 2024 00:59
20° - Nome do Evento: O Desafio da Esfinge Enigmática
Efeito de Sucesso: Ao resolver os enigmas da Esfinge Enigmática, as Unidades ganham acesso a um tesouro antigo ou um conhecimento valioso. Elas recebem uma Arma Mágica. (editado)domingo, 28 de abril de 2024 17:56
[01:01]quarta-feira, 10 de abril de 2024 01:01
21° - Nome do Evento: O Despertar do Guardião das Sombras
Efeito de Sucesso: Ao despertar o Guardião das Sombras com sucesso, as Unidades ganham sua assistência durante um período limitado de tempo. O Guardião das Sombras é uma entidade furtiva e astuta que pode ajudar as Unidades em missões de espionagem. O Jogador escolhe outro Jogador, e faz uma pergunta sobre o Reino dele, e ele deve responder com a verdade e informações claras. (editado)domingo, 28 de abril de 2024 17:56
[01:03]quarta-feira, 10 de abril de 2024 01:03
22° - Nome do Evento: A Corrida dos Elementais
Efeito de Sucesso: A Unidade consegue vencer a corrida dos Elementais, recebendo uma benção. Essa Unidade reduz pela metade todo dano Elemental (Gelo, Eletricidade e Fogo) que receber. (editado)domingo, 28 de abril de 2024 18:02
[01:04]quarta-feira, 10 de abril de 2024 01:04
23° - Nome do Evento: O Enigma das Ruínas Antigas
Efeito de Sucesso: Ao decifrar o Enigma das Ruínas Antigas, as Unidades descobrem um conhecimento valioso sobre a história da região ou um segredo escondido nas ruínas. A Unidade recebe +2 em Habilidade permanentemente. (editado)domingo, 28 de abril de 2024 18:02
[01:05]quarta-feira, 10 de abril de 2024 01:05
24° - Nome do Evento: O Desafio do Labirinto Elemental
Efeito de Sucesso: Ao completar o Desafio do Labirinto Elemental, as Unidades desvendam segredos sobre os quatro elementos primordiais. Os Elementais resolvem ajudar o Território, fazendo todos os Token de Recursos daquele Território contarem como dois. (editado)domingo, 28 de abril de 2024 18:03
O Kevin — 10/04/2024 01:08quarta-feira, 10 de abril de 2024 01:08
25° - Nome do Evento: O Despertar da Estrela Caída
Efeito de Sucesso: Ao despertar a Estrela Caída com sucesso, as Unidades desvendam segredos arcanos antigos. Ela ganha acesso a uma magia aleatória, que pode lançar uma vez por Batalha, sem custo. (editado)domingo, 28 de abril de 2024 18:03
[01:15]quarta-feira, 10 de abril de 2024 01:15
26° - Nome do Evento: O Desafio do Labirinto Subterrâneo
Efeito de Sucesso: Ao superar o Desafio do Labirinto Subterrâneo, a Unidade descobre um tesouro escondido e trás de volta para o Reino, recebendo 20 Minérios, Suprimentos e Arcanas. (editado)sexta-feira, 3 de maio de 2024 01:49
O Kevin — 10/04/2024 08:36quarta-feira, 10 de abril de 2024 08:36
27° - Nome do Evento: A Travessia da Ponte Celestial
Efeito de Sucesso: Ao atravessar a Ponte Celestial com sucesso, as Unidades recebem a bênção dos deuses. Ela ganha um bônus permanente +1 em todos os atributos e um Escudo Mágico. (editado)domingo, 28 de abril de 2024 18:04
[08:37]quarta-feira, 10 de abril de 2024 08:37
28° - Nome do Evento: O Desafio do Templo Esquecido
Efeito de Sucesso: Ao superar o Desafio do Templo Esquecido, as Unidades desbloqueiam a entrada para um antigo templo cheio de riquezas e conhecimentos perdidos. Elas recebem um item mágico aleatório. (editado)domingo, 28 de abril de 2024 18:05
O Kevin — 10/04/2024 08:44quarta-feira, 10 de abril de 2024 08:44
28º - Nome do Evento: O Despertar da Serpente Anciã
Efeito de Sucesso: Ao despertar a Serpente Anciã com sucesso, as Unidades ganham sua bênção protetora. A Unidade reduz todo Dano Verdadeiro que receber em 2. (editado)domingo, 28 de abril de 2024 18:06
[08:48]quarta-feira, 10 de abril de 2024 08:48
29° - Nome do Evento: O Despertar da Estátua Ancestral
Efeito de Sucesso: Ao despertar a Estátua Ancestral com sucesso, as Unidades ganham acesso ao conhecimento ancestral guardado pela estátua. Ela escolhe uma Magia e pode lança-a uma vez por Batalha. (editado)domingo, 28 de abril de 2024 18:06
O Kevin — 10/04/2024 08:52quarta-feira, 10 de abril de 2024 08:52
30° - Nome do Evento: O Resgate do Grifo Dourado
Efeito de Sucesso: Ao resgatar o Grifo Dourado com sucesso, as Unidades ganham a lealdade da criatura, que se torna um valioso aliado no Reino. Você recebe uma Criatura de Nível 5 que sempre acompanhará a Unidade que lidou com o Evento. Se a Unidade morrer, a Criatura fica no Território de sua morte e se torna hostil a todos que Batalharem ali. Além disso, a presença da Criatura aumenta o moral das tropas, proporcionando um bônus de +1D em Combate enquanto ela estiver viva e na mesma Batalha que eles. (editado)domingo, 28 de abril de 2024 18:09
[08:55]quarta-feira, 10 de abril de 2024 08:55
31° - Nome do Evento: O Eclipse das Sombras Eternas
Efeito de Sucesso: Se as Unidades superarem o Eclipse das Sombras Eternas, elas impedem que uma antiga profecia se cumpra, evitando que uma era de trevas caia sobre o reino. Como recompensa, a Unidade recebe a bênção de uma divindade, que concede proteção contra a magia das trevas, dando um bônus de +3D em todos os Testes Resistidos contra Unidades com alinhamento Mal. (editado)domingo, 28 de abril de 2024 18:09
[08:56]quarta-feira, 10 de abril de 2024 08:56
32° - Nome do Evento: O Segredo do Oráculo de Vidro
Efeito de Sucesso: Ao decifrar o Segredo do Oráculo de Vidro, as Unidades ganham acesso a visões proféticas que revelam eventos futuros importantes. Isso permite que o reino se prepare melhor para os desafios vindouros, permitindo que o Reino re-role qualquer teste de Defesa ou Invasão, uma vez por Invasão. (editado)domingo, 28 de abril de 2024 18:09
[08:58]quarta-feira, 10 de abril de 2024 08:58
33° - Nome do Evento: A Ascensão dos Elementais de Gelo
Efeito de Sucesso: Com sucesso na contenção dos Elementais de Gelo, as Unidades conseguem dissipar a tempestade mágica que ameaçava o reino. Isso garante uma estação de colheita abundante, dobrando a Produção de Suprimentos do Reino. (editado)domingo, 28 de abril de 2024 18:09
O Kevin — 10/04/2024 09:00quarta-feira, 10 de abril de 2024 09:00
34° - Nome do Evento: O Portal dos Espíritos Ancestrais,
Efeito de Sucesso: Ao abrir o Portal dos Espíritos Ancestrais, as Unidades ganham acesso à sabedoria ancestral e à orientação dos espíritos. Ao invés de morrer diretamente, sempre que uma Unidade do seu Reino cair a 0 de Vitalidade, role 1D4. Em um 4, ela sobrevive e escapa da batalha., (editado)sábado, 27 de abril de 2024 11:03
[09:03]quarta-feira, 10 de abril de 2024 09:03
35° - Nome do Evento: O Enigma das Estrelas Cadentes
Efeito de Sucesso: Ao desvendar o Enigma das Estrelas Cadentes, as Unidades ganham conhecimento sobre a localização de um tesouro escondido. Elas encontram um mapa estelar que aponta para um local secreto onde gemas preciosas e artefatos mágicos estão enterrados. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, você dobra a quantidade atual de Devoções que possui., (editado)sexta-feira, 3 de maio de 2024 01:53
[09:06]quarta-feira, 10 de abril de 2024 09:06
36° - Nome do Evento: O Enigma da Floresta Esmeralda
Efeito de Sucesso: Ao resolver o enigma, as Unidades ganham o conhecimento de uma planta rara e mágica que cresce apenas na Floresta Esmeralda. Essa planta pode ser usada para criar poções de cura mais potentes. Todas as Unidades do Reino começam as Batalhas com uma Poção de Cura (4 de Vitalidade), que pode ser usada nelas mesmas ou em outras criaturas., (editado)sábado, 27 de abril de 2024 11:02
[09:07]quarta-feira, 10 de abril de 2024 09:07
37° - Nome do Evento: O Mistério do Relicário Perdido
Efeito de Sucesso: Se bem-sucedidas, as Unidades recuperam o relicário, que contém um antigo artefato capaz de fortalecer as defesas do reino. O reino ganha um bônus permanente de +2D em todas as rolagens de Defesa de Território., (editado)sábado, 27 de abril de 2024 10:59
O Kevin — 10/04/2024 09:11quarta-feira, 10 de abril de 2024 09:11
38° - Nome do Evento: O Legado do Mago Ancião
Efeito de Sucesso: Se bem-sucedidas, as Unidades descobrem um tomo de conhecimento arcano que contém feitiços perdidos e informações sobre criaturas místicas. Todas suas Unidades podem usar a ação de Conjurar., (editado)sábado, 27 de abril de 2024 10:59
[09:16]quarta-feira, 10 de abril de 2024 09:16
39° - Nome do Evento: A Profecia do Dragão Ancião
Efeito de Sucesso: Se bem-sucedidas, as Unidades desvendam a profecia, que revela a localização de um tesouro escondido pelo Dragão Ancião. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, você dobra a quantidade atual de Minérios que possui., (editado)sexta-feira, 3 de maio de 2024 01:48
[09:26]quarta-feira, 10 de abril de 2024 09:26
40° - Nome do Evento: A Queda do Templo Proibido
Efeito de Sucesso: Se bem-sucedidas, as Unidades encontram um artefato antigo que concede a localização de um conhecimento ancião mágico. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, você dobra a quantidade atual de Arcana que possui., (editado)sexta-feira, 3 de maio de 2024 01:57
O Kevin — 10/04/2024 09:31quarta-feira, 10 de abril de 2024 09:31
41° - Nome do Evento: O Despertar do Leviatã
Efeito de Sucesso: Se bem-sucedidas, as Unidades apaziguam o Leviatã e o mantem em seu sono profundo, se aproveitando da sua aura mágica. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, você dobra a quantidade atual de Suplementos que possui., (editado)segunda-feira, 22 de abril de 2024 15:08
O Kevin — 10/04/2024 09:39quarta-feira, 10 de abril de 2024 09:39
42° - Nome do Evento: A Revelação do Orbe Celestial
Efeito de Sucesso: Se bem-sucedidas, as Unidades ativam o orbe, que se revela a localização de um artefato celestial capaz de transformar Unidades em Semi-Deuses. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, você dobra a quantidade atual de Experiência que possuir., (editado)sexta-feira, 3 de maio de 2024 01:55
O Kevin — 10/04/2024 09:51quarta-feira, 10 de abril de 2024 09:51
43° - Nome do Evento: A Ruína do Despertar Primordial
Efeito de Sucesso: Ao investigar com sucesso a Ruína do Despertar Primordial, as Unidades desbloqueiam conhecimentos arcanos ancestrais. Elas recebem um pergaminho mágico contendo um ritual arcana que permite invocar uma Invocação Genérica (Elemental) aliada para auxiliá-la durante uma Batalha. Esse pergaminho pode ser usado uma vez., (editado)sábado, 27 de abril de 2024 10:57
[09:58]quarta-feira, 10 de abril de 2024 09:58
44° - Nome do Evento: O Templo do Deus-Dragão
Efeito de Sucesso: Ao explorar o Templo com sucesso, as Unidades descobrem um local secreto de grande importância na história, que revela a localização de uma nova maneira de proteger seu Reino. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, você concede um Posto gratuito para todos os seus Territórios Dominados que tenham 2 ou menos Postos. (editado)domingo, 28 de abril de 2024 22:32
O Kevin — 10/04/2024 10:03quarta-feira, 10 de abril de 2024 10:03
45° - Nome do Evento: A Câmara do Lich-Rei
Efeito de Sucesso: Ao explorar o Câmara com sucesso, as Unidades descobrem um local secreto de grande importância na história, que revela a localização de uma nova maneira de proteger seu Reino. Você descobre a localização de um Tesouro em algum Território aleatório. Caso explore aquele Território ou Domine ele, um dispositivo é adicionado a sua Capital, que encanta todas as Unidades do seu Reino. A partir disso, todos os Danos de suas Unidades são convertidos para Dano Verdadeiro. (editado)domingo, 28 de abril de 2024 22:32
21 de abril de 2024
O Kevin — 21/04/2024 02:51domingo, 21 de abril de 2024 02:51
46° - Nome do Evento: Vila Selvagem (1° Nível)
Efeito de Sucesso: Você encontra uma Vila que mora no Território Selvagem, e acontece que conseguiu sua simpatia depois de um tempo interagindo com eles. Você recupera os Minérios gastos para usar essa ação de Conquista. (editado)sexta-feira, 3 de maio de 2024 01:46
[02:53]domingo, 21 de abril de 2024 02:53
47° - Nome do Evento: Vila Selvagem (2° Nível)
Efeito de Sucesso: Você encontra uma Vila que mora no Território Selvagem, e acontece que conseguiu sua simpatia depois de um tempo interagindo com eles. Você recupera os Minérios gastos para usar essa ação de Conquista, e recebe uma Tropa a sua escolha instantaneamente. (editado)sexta-feira, 3 de maio de 2024 01:46
[02:54]domingo, 21 de abril de 2024 02:54
48° - Nome do Evento: Vila Selvagem (3° Nível)
Efeito de Sucesso: Você encontra uma Vila que mora no Território Selvagem, e acontece que conseguiu sua simpatia depois de um tempo interagindo com eles. Você recupera os Minérios gastos para usar essa ação de Conquista, e recebe um novo Herói instantaneamente. (editado)sexta-feira, 3 de maio de 2024 01:46
22 de abril de 2024
O Kevin — 22/04/2024 23:43segunda-feira, 22 de abril de 2024 23:43
49° - Nome do Evento: Portais Dimensionais
Efeito de Sucesso: Você descobre um antigo mecanismo, colocado nesse local por alguma entidade anciã. Ele abre um portal que conecta esse Território com um outro Território aleatório. (editado)domingo, 28 de abril de 2024 22:32
25 de abril de 2024
O Kevin — 25/04/2024 01:18quinta-feira, 25 de abril de 2024 01:18
50° - Nome do Evento: Decisões Difíceis
Efeito de Sucesso: Você descobre uma Entidade que lhe faz tomar uma decisão: Sacrificar sua vida, e melhorar a dos outros, ou Sacrificar a vida deles, e melhorar a sua. Se escolher a primeira opção, você morre, e todas as suas outras Unidades presentes nesse Território recebem permanentemente +1 em todos os atributos. Se você escolher a segunda opção, todas as suas outras Unidades presentes nesse Território morrem, e você recebe o nível delas (Mínimo de 1 para cada) em Pontos de Atributos para distribuir livremente. (editado)domingo, 28 de abril de 2024 22:32
3 de maio de 2024
O Kevin — 03/05/2024 03:01sexta-feira, 3 de maio de 2024 03:01
51° - Nome do Evento: Tábula da Ressureição
Efeito de Sucesso: Você encontra uma Tábula capaz de reviver um ser vivo para seu auge de saúde. Se o seu Regente estiver morto, você o revive. Caso contrário, você vende a Tábula da Ressureição, recebendo 10 em todos os Recursos.
`;

function cleanEffect(text: string): string {
  // Remove inline (editado)... tails and trailing commas
  return text
    .replace(/\(editado\)[^\n]*/g, "")
    .replace(/,\s*$/g, "")
    .trim();
}

export function parseEvents(raw: string): EventDef[] {
  const events: EventDef[] = [];
  const regex =
    /(\d{1,2})(?:°|º)\s*-\s*Nome do Evento:\s*(.*?)\r?\nEfeito de Sucesso:\s*([\s\S]*?)(?=(?:\r?\n\d{1,2}(?:°|º)\s*-\s*Nome do Evento:)|$)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(raw)) !== null) {
    const id = parseInt(m[1], 10);
    const name = m[2].trim();
    const successEffect = cleanEffect(m[3]);
    events.push({ id, name, successEffect });
  }
  return events;
}

export const EVENTS: EventDef[] = parseEvents(RAW_TEXT);
