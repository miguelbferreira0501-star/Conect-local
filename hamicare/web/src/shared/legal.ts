// Política de privacidade e termos de uso do HamiCare.
// O mesmo texto aparece no app (Ajustes) e no site (/privacidade e /termos),
// que é o endereço pedido pela Google Play e pela App Store.
//
// ANTES DE PUBLICAR: troque os campos entre [colchetes] em LEGAL_INFO pelos seus dados
// e, se puder, peça para um advogado revisar. Este texto é um ponto de partida sério,
// mas não substitui orientação jurídica.

export const LEGAL_INFO = {
  /** Quem responde pelo app: razão social da empresa (ou seu nome completo, se for pessoa física/MEI). */
  controlador: '[NOME DA EMPRESA OU SEU NOME COMPLETO]',
  /** CNPJ (ou CPF, se ainda não tiver empresa). */
  documento: '[CNPJ OU CPF]',
  /** Cidade e estado. */
  cidade: '[CIDADE/UF]',
  /** E-mail para dúvidas e pedidos de privacidade. */
  email: '[E-MAIL DE CONTATO]',
  /** Data desta versão (AAAA-MM-DD). */
  atualizado: '2026-11-04',
};

export type LegalId = 'privacidade' | 'termos';
/** Um parágrafo (texto) ou uma lista (vários itens). */
export type LegalBlock = string | string[];
export interface LegalSection {
  h: string;
  body: LegalBlock[];
}
export interface LegalDoc {
  id: LegalId;
  title: string;
  /** Resumo em linguagem simples, mostrado no topo. */
  summary: string[];
  sections: LegalSection[];
}

const I = LEGAL_INFO;

export const PRIVACY: LegalDoc = {
  id: 'privacidade',
  title: 'Política de Privacidade',
  summary: [
    'Sem conta, tudo o que você faz no HamiCare fica só no seu aparelho. Nós não recebemos nada.',
    'Com conta, guardamos um backup privado do seu progresso. Peso, calorias, humor e diário só você vê.',
    'Não vendemos seus dados, não mostramos anúncios e não usamos rastreadores de publicidade.',
    'Você pode baixar, corrigir ou apagar seus dados quando quiser, direto no app.',
  ],
  sections: [
    {
      h: '1. Quem cuida dos seus dados',
      body: [
        `O HamiCare é oferecido por ${I.controlador}, inscrito sob o nº ${I.documento}, com sede em ${I.cidade} ("nós"). Somos o controlador dos dados pessoais tratados no app, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018, "LGPD").`,
        `Canal de privacidade (encarregado): ${I.email}. Respondemos em até 15 dias.`,
      ],
    },
    {
      h: '2. Quais dados usamos',
      body: [
        'Sem conta: o app funciona inteiro no seu aparelho. Seu Hami, missões, cardápio, peso, diário e humor ficam guardados apenas no armazenamento local do navegador ou do aparelho. Nós não temos acesso.',
        'Com conta, tratamos:',
        [
          'Dados da conta: nome, e-mail, faixa de idade e senha. A senha é guardada de forma embaralhada (hash), e nem nós conseguimos lê-la.',
          'Backup do progresso: tudo o que o app guarda no aparelho, como Hami, roupas, casa, missões, sementes, conquistas e configurações.',
          'Dados de saúde, que a LGPD chama de dados sensíveis: peso, medidas, metas de peso, calorias do cardápio e das missões, humor, sono, diário e respostas dos exercícios de bem-estar. Eles ficam apenas no seu backup privado e nunca aparecem para amigos.',
          'Parte social, se você usar: perfil público (nome, código de amigo, aparência do Hami, casa, nível, bio, ofensiva e conquistas), amizades, grupos, posts, fotos que você escolher postar, comentários, reações, presentes, bloqueios e denúncias.',
          'Lembretes, se você ligar: o endereço de notificação do aparelho, o horário escolhido, o fuso horário e os tipos de lembrete.',
          'Dados técnicos: um cookie de sessão para manter você conectado, o endereço IP (usado na hora para barrar tentativas em massa de login) e registros técnicos de erros e acesso do servidor.',
        ],
        'Não coletamos localização, contatos, identificador de publicidade nem o rolo da câmera. Uma foto só sai do aparelho quando você mesmo escolhe postá-la.',
      ],
    },
    {
      h: '3. Para que usamos e com qual base legal',
      body: [
        [
          'Criar e manter sua conta, fazer o backup e recuperar seu progresso: execução do contrato com você (LGPD, art. 7º, V).',
          'Dados de saúde (peso, calorias, humor, diário, sono): seu consentimento específico e destacado (art. 11, I), dado quando você cria a conta e quando escolhe registrar esses dados. Você pode retirar o consentimento quando quiser: é só apagar os registros, desligar o acompanhamento de peso ou excluir a conta.',
          'Amigos, grupos e feed: execução do contrato, para mostrar o que você compartilha com quem você escolheu.',
          'Moderação, segurança e proteção de crianças e adolescentes: legítimo interesse (art. 7º, IX) e proteção da sua segurança e da dos outros usuários.',
          'Lembretes: seu consentimento, dado ao ligar as notificações no app e no aparelho.',
          'Cumprir obrigações legais e responder a autoridades: art. 7º, II e VI.',
        ],
        'Não usamos seus dados para anúncios, não montamos perfil para publicidade e não vendemos nem alugamos dados para ninguém.',
      ],
    },
    {
      h: '4. Com quem compartilhamos',
      body: [
        'Só com empresas que nos ajudam a fazer o app funcionar (operadores), e apenas o necessário:',
        [
          'Hospedagem do servidor (por exemplo, Render).',
          'Banco de dados (por exemplo, Neon).',
          'Envio de e-mails, como o de troca de senha (por exemplo, Resend).',
          'Serviço de notificações do seu navegador ou aparelho (Google, Apple ou Mozilla), que recebe só o endereço de notificação e o texto do lembrete.',
          'Lojas de aplicativos e meios de pagamento, se você assinar o HamiCare+. Eles cuidam do pagamento; nós não recebemos os dados do seu cartão.',
        ],
        'Também podemos fornecer dados quando a lei exigir ou por ordem de autoridade competente.',
      ],
    },
    {
      h: '5. Dados fora do Brasil',
      body: [
        'Alguns desses serviços guardam dados em servidores fora do Brasil, como nos Estados Unidos. Fazemos essa transferência com garantias de proteção previstas na LGPD (art. 33), como cláusulas contratuais, e escolhemos fornecedores com bons padrões de segurança.',
      ],
    },
    {
      h: '6. Por quanto tempo guardamos',
      body: [
        [
          'Enquanto sua conta existir, guardamos o backup e a parte social.',
          'Ao excluir a conta (Ajustes → Conta e nuvem → Excluir minha conta), apagamos na hora o backup, o perfil, amizades, grupos que você criou, posts, comentários, reações, presentes e lembretes. Cópias de segurança do banco de dados somem automaticamente em até 30 dias.',
          'O link de troca de senha vence em 1 hora e vale uma vez só.',
          'Registros de acesso ao servidor (data, hora e IP) podem ser guardados pelo prazo exigido em lei, de 6 meses (Marco Civil da Internet, Lei nº 12.965/2014, art. 15).',
          'Denúncias e registros de moderação ficam pelo tempo necessário para proteger a comunidade e cumprir a lei.',
        ],
      ],
    },
    {
      h: '7. Crianças e adolescentes',
      body: [
        'O HamiCare foi pensado para ser seguro para todas as idades, seguindo o Estatuto da Criança e do Adolescente, o art. 14 da LGPD e o Estatuto Digital da Criança e do Adolescente (Lei nº 15.211/2025), sempre no melhor interesse da criança e do adolescente.',
        [
          'Menores de 13 anos só criam conta com a autorização de um responsável, e não têm acesso à parte social (amigos, feed e grupos).',
          'Para menores de 18 anos, o app não mostra números de peso nem de calorias e não incentiva dietas: a jornada é de hábitos.',
          'Não há anúncios, nem perfil para publicidade, nem caixas de recompensa aleatórias pagas.',
          'Comentários passam por um filtro de gentileza e qualquer post pode ser denunciado.',
        ],
        `Se você é responsável e quer ver, corrigir ou apagar os dados de uma criança, escreva para ${I.email}.`,
      ],
    },
    {
      h: '8. Seus direitos',
      body: [
        'Pela LGPD (art. 18), você pode, a qualquer momento:',
        [
          'Confirmar se tratamos seus dados e ter acesso a eles.',
          'Corrigir dados incompletos ou errados.',
          'Pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários.',
          'Levar seus dados para outro serviço (portabilidade).',
          'Saber com quem compartilhamos seus dados.',
          'Retirar o consentimento e saber o que acontece se você não der o consentimento.',
          'Pedir a revisão de decisões automáticas, como um comentário barrado pelo filtro de gentileza ou um post escondido por denúncias (art. 20).',
        ],
        `No próprio app você já consegue: ver e editar seus dados, copiar o código de backup com todo o seu progresso (Ajustes → Código de backup) e excluir a conta. Para o resto, escreva para ${I.email}. Você também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD), pelo site gov.br/anpd.`,
      ],
    },
    {
      h: '9. Como protegemos seus dados',
      body: [
        [
          'Conexão sempre criptografada (HTTPS).',
          'Senhas embaralhadas com bcrypt; o link de troca de senha é guardado embaralhado, vence rápido e derruba as sessões antigas.',
          'Cookie de sessão protegido (httpOnly) e proteção contra requisições forjadas.',
          'Regras de acesso no próprio banco de dados: cada pessoa só lê o que é dela ou o que os amigos compartilharam.',
          'Limite de tentativas de login e de pedidos de troca de senha.',
        ],
        'Nenhum sistema é 100% seguro. Se acontecer um incidente que possa trazer risco ou dano relevante, avisaremos você e a ANPD (art. 48).',
      ],
    },
    {
      h: '10. Cookies e armazenamento no aparelho',
      body: [
        'Usamos apenas o que é essencial: um cookie de sessão (hc_session) para manter você conectado e o armazenamento local do aparelho para guardar seu progresso. Não usamos cookies de publicidade nem de análise de terceiros.',
      ],
    },
    {
      h: '11. Mudanças nesta política',
      body: [
        'Se mudarmos algo importante, avisaremos no app antes de a mudança valer. A data da versão atual fica no topo desta página.',
      ],
    },
    {
      h: '12. Fale com a gente',
      body: [`${I.controlador} · ${I.documento} · ${I.cidade} · ${I.email}`],
    },
  ],
};

export const TERMS: LegalDoc = {
  id: 'termos',
  title: 'Termos de Uso',
  summary: [
    'O HamiCare é um app de autocuidado com um bichinho virtual. Ele não é serviço médico nem nutricional.',
    'As calorias são estimativas. Antes de mudar sua alimentação ou começar exercícios, converse com um profissional de saúde.',
    'Seja gentil na comunidade. Conteúdo que machuca alguém é removido.',
    'Sementes e itens do app são virtuais e não valem dinheiro.',
  ],
  sections: [
    {
      h: '1. Aceitação',
      body: [
        `Estes Termos são um contrato entre você e ${I.controlador} (${I.documento}), responsável pelo HamiCare. Ao usar o app ou criar uma conta, você concorda com estes Termos e com a Política de Privacidade. Se não concordar, não use o app.`,
      ],
    },
    {
      h: '2. Quem pode usar',
      body: [
        [
          'Qualquer idade pode usar o HamiCare sem conta, com o progresso guardado só no aparelho.',
          'Menores de 13 anos só podem criar conta com a autorização de um responsável, que aceita estes Termos em nome deles. A parte social fica desligada para essa idade.',
          'Adolescentes de 13 a 17 anos devem usar com o conhecimento de um responsável. Para eles, o app não mostra números de peso nem de calorias.',
        ],
      ],
    },
    {
      h: '3. O HamiCare não é tratamento de saúde',
      body: [
        'O HamiCare ajuda a criar hábitos com um bichinho virtual. Ele não faz diagnóstico, não prescreve dieta nem treino e não substitui médico, nutricionista, educador físico ou psicólogo.',
        [
          'As calorias das missões e do cardápio são estimativas aproximadas, baseadas em tabelas e médias. O valor real muda de pessoa para pessoa.',
          'O app limita o ritmo de perda ou ganho de peso para manter metas seguras, mas quem decide e acompanha sua saúde é você, com um profissional.',
          'Se você tem alguma condição de saúde, está grávida, tem ou já teve transtorno alimentar, procure um profissional antes de mudar sua alimentação ou rotina de exercícios.',
          'Se estiver passando por um momento difícil, procure ajuda: o CVV atende de graça pelo telefone 188 e pelo site cvv.org.br, 24 horas. Em emergência, ligue 192 (SAMU).',
        ],
      ],
    },
    {
      h: '4. Sua conta',
      body: [
        [
          'Use dados verdadeiros e um e-mail que seja seu.',
          'Guarde sua senha com cuidado e não a compartilhe. Se esquecer, use "Esqueci minha senha".',
          'Cada conta é de uma pessoa só. Você responde pelo que for feito com ela.',
          'Você pode excluir a conta quando quiser, em Ajustes.',
        ],
      ],
    },
    {
      h: '5. Regras da comunidade',
      body: [
        'Amigos, grupos e feed existem para apoio e carinho. Não é permitido:',
        [
          'Ofender, humilhar, ameaçar ou fazer bullying, inclusive sobre corpo e peso.',
          'Publicar conteúdo sexual, violento, de ódio ou discriminatório.',
          'Incentivar dietas extremas, jejum perigoso, transtornos alimentares ou automutilação.',
          'Postar dados pessoais ou fotos de outras pessoas sem permissão.',
          'Fazer spam, golpes, propaganda ou se passar por outra pessoa.',
          'Tentar burlar a segurança do app ou acessar contas e dados de outras pessoas.',
        ],
        'Comentários passam por um filtro automático de gentileza, e posts com várias denúncias ficam escondidos até a análise. Podemos remover conteúdo e suspender ou encerrar contas que desrespeitem estas regras. Se achar que a decisão foi errada, peça revisão pelo nosso e-mail.',
      ],
    },
    {
      h: '6. O que você publica',
      body: [
        'O que você posta continua sendo seu. Você nos autoriza a guardar e mostrar esse conteúdo dentro do app, apenas para as pessoas com quem você escolheu compartilhar (amigos e grupos), pelo tempo em que ele estiver publicado. Ao apagar o post ou a conta, ele sai do app. Só publique o que você tem direito de publicar.',
      ],
    },
    {
      h: '7. Sementes e itens virtuais',
      body: [
        [
          'Sementes são a moeda do app. Você ganha cuidando do Hami e cumprindo missões.',
          'Sementes, roupas, pelagens, móveis e outros itens são licenças de uso dentro do app. Eles não têm valor em dinheiro, não podem ser trocados por dinheiro nem vendidos fora do app.',
          'Presentes entre amigos são permitidos dentro do app.',
          'Podemos ajustar preços em sementes, itens e temporadas para manter o jogo equilibrado.',
        ],
        'Baús: abrem só com sementes ganhas no app. Não existe compra de sementes, baús ou chances com dinheiro, e a assinatura HamiCare+ não dá baús nem sementes. Os itens dos baús são só enfeites (roupas e decoração): não mudam missões, saúde, nível nem progresso.',
        'As chances de cada raridade aparecem na loja antes de abrir e já contam a proteção contra azar: depois de alguns baús sem item raro, a chance de raro sobe, e há um limite garantido. Item repetido vira fragmentos, que podem ser trocados na Oficina pelo item que você escolher.',
        'Para menores de 18 anos, o baú é revelado: o item aparece antes da compra e é exatamente ele que vem. Nada é sorteado na hora da compra.',
      ],
    },
    {
      h: '8. HamiCare+ (assinatura)',
      body: [
        [
          'O HamiCare+ libera itens e recursos extras. O preço, o período e a forma de renovação aparecem antes de você confirmar.',
          'O teste grátis dura 7 dias e pode ser usado uma vez por conta. Nada é cobrado no teste.',
          'Quando a assinatura for paga pela Google Play ou pela App Store, a cobrança, a renovação automática e o cancelamento seguem a conta da loja. Você pode cancelar quando quiser nas configurações da loja, e o acesso continua até o fim do período já pago.',
          'Você pode desistir da compra em até 7 dias a partir da contratação e receber o valor de volta (Código de Defesa do Consumidor, art. 49). Peça pela loja ou pelo nosso e-mail.',
        ],
      ],
    },
    {
      h: '9. Propriedade intelectual',
      body: [
        'O nome HamiCare, o personagem Hami, as ilustrações, os textos, as músicas e o código do app são nossos ou licenciados para nós. Você pode usar o app para fins pessoais, mas não pode copiar, vender ou criar produtos a partir dele sem autorização.',
      ],
    },
    {
      h: '10. Funcionamento do app',
      body: [
        'Trabalhamos para o app funcionar bem, mas ele pode ter falhas, ficar fora do ar para manutenção ou mudar. Podemos criar, alterar ou retirar recursos. Se um dia o HamiCare for encerrado, avisaremos com pelo menos 30 dias de antecedência para você guardar seu progresso.',
        'Sem conta, seu progresso vive só no aparelho: se o aparelho for perdido ou os dados do navegador forem apagados, ele pode se perder. Por isso recomendamos criar uma conta ou guardar o código de backup.',
      ],
    },
    {
      h: '11. Responsabilidade',
      body: [
        'Respondemos pelo app nos limites da lei, incluindo o Código de Defesa do Consumidor. Não respondemos por decisões de saúde tomadas sem orientação profissional, nem pelo que outros usuários publicam, mas agimos rápido para remover conteúdo que desrespeite estes Termos quando ficamos sabendo dele.',
      ],
    },
    {
      h: '12. Mudanças nestes Termos',
      body: [
        'Se mudarmos estes Termos, avisaremos no app. Mudanças importantes só valem depois do aviso, e, quando a lei pedir, pediremos que você aceite de novo.',
      ],
    },
    {
      h: '13. Lei e foro',
      body: [
        'Estes Termos seguem as leis do Brasil. Qualquer disputa pode ser resolvida no foro da cidade onde você mora, como garante o Código de Defesa do Consumidor. Antes disso, fale com a gente: quase tudo se resolve por e-mail.',
        `Contato: ${I.email}`,
      ],
    },
  ],
};

export const LEGAL: Record<LegalId, LegalDoc> = { privacidade: PRIVACY, termos: TERMS };

export function formatLegalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return `${d} de ${months[m - 1]} de ${y}`;
}

/** Os campos de LEGAL_INFO ainda estão com [colchetes]? (O servidor avisa no terminal.) */
export function legalPlaceholders(): string[] {
  return Object.entries(LEGAL_INFO)
    .filter(([, v]) => /^\[.*\]$/.test(v))
    .map(([k]) => k);
}
