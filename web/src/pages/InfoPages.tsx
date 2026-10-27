import { Compass } from 'lucide-react';
import { BADGES, BRAND, RANKING_PARAMS, REVIEW_RULES } from '@conecta/shared';
import { PageHeader } from '@/components/Layout';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

export function HowItWorksPage() {
  const w = RANKING_PARAMS.weights;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <div>
      <PageHeader title="Como funciona" />
      <div className="container-app max-w-3xl space-y-4 py-5">
        <Section title="Como ordenamos os resultados">
          <p>A nota média sozinha não decide a posição. Uma empresa com uma única avaliação 5 estrelas não passa automaticamente na frente de outra com centenas de avaliações consistentes.</p>
          <p>Usamos uma <strong>nota ajustada</strong> (média bayesiana): cada empresa começa como se tivesse {RANKING_PARAMS.priorWeight} avaliações com a média geral da plataforma. Conforme recebe avaliações reais, a nota ajustada se aproxima da média dela.</p>
          <p>Na ordem “Mais relevantes”, combinamos:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Nota ajustada</strong>: {pct(w.quality)}</li>
            <li><strong>Quantidade de avaliações</strong>, multiplicada pela nota (muitas avaliações ruins não ajudam, {pct(w.volume)}</li>
            <li><strong>Avaliações recentes</strong> (o peso cai pela metade a cada {RANKING_PARAMS.recencyHalfLifeDays} dias sem novas avaliações, {pct(w.recency)}</li>
            <li><strong>Consistência</strong> das notas (pouca variação entre clientes, {pct(w.consistency)}</li>
            <li><strong>Perfil completo</strong> (descrição, contatos, horários, serviços com preço, fotos, {pct(w.completeness)}</li>
          </ul>
          <p>Depois, o resultado é ajustado pela <strong>relevância para o que você pesquisou</strong> e pela <strong>localização</strong>: empresas com sede na sua cidade vêm antes das que apenas atendem a região ou atendem só on-line.</p>
          <p>Para não esconder quem acabou de chegar, a cada {RANKING_PARAMS.newcomerSlotEvery} posições reservamos uma vaga para uma empresa nova (até {RANKING_PARAMS.newcomerMaxDays} dias e menos de {RANKING_PARAMS.newcomerMaxReviews} avaliações). Ela aparece com a etiqueta “Nova na plataforma”, que <strong>não é selo de qualidade</strong>.</p>
          <p>Em “Melhor avaliadas”, ordenamos pela nota ajustada. Notas são exibidas com uma casa decimal e <strong>sempre arredondadas para baixo</strong>.</p>
        </Section>
        <Section title="O que não fazemos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Empresas não pagam para subir na lista nem para ganhar selos.</li>
            <li>Empresas não podem apagar avaliações negativas legítimas.</li>
            <li>Se houver anúncios no futuro, eles serão identificados como “Patrocinado” e ficarão separados da lista orgânica.</li>
            <li>Não inventamos notas, distâncias, preços ou horários. Quando um dado não existe, mostramos isso.</li>
          </ul>
        </Section>
        <Section title="Como garantimos avaliações confiáveis">
          <ul className="list-disc space-y-1 pl-5">
            <li>Só avalia quem contratou pela plataforma: depois de um agendamento realizado ou de marcar um orçamento como contratado.</li>
            <li>Uma avaliação por contratação e, no máximo, uma avaliação da mesma empresa a cada {REVIEW_RULES.minDaysBetweenReviewsSameBusiness} dias.</li>
            <li>Limite de {REVIEW_RULES.maxReviewsPerDay} avaliações por dia por pessoa.</li>
            <li>Textos com links, e-mails ou telefones são bloqueados.</li>
            <li>Você pode editar sua avaliação por até {REVIEW_RULES.editableDays} dias e excluí-la quando quiser.</li>
            <li>Qualquer pessoa pode denunciar uma avaliação. Denúncias vão para moderação; não removem a avaliação automaticamente.</li>
          </ul>
        </Section>
        <Section title="Selos de confiança">
          <dl className="space-y-3">
            {Object.values(BADGES).map((b) => (
              <div key={b.id}><dt className="font-semibold">{b.label}</dt><dd className="text-sm text-muted">{b.criteria}</dd></div>
            ))}
          </dl>
        </Section>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div>
      <PageHeader title="Termos e privacidade" />
      <div className="container-app max-w-3xl space-y-4 py-5">
        <div className="rounded-xl border border-warning-700/20 bg-warning-50 p-4 text-sm text-warning-700">
          Texto-modelo para a versão de demonstração. Antes de publicar, revise com assessoria jurídica.
        </div>
        <Section title="Termos de uso">
          <p>O {BRAND.name} ajuda você a encontrar e comparar empresas e profissionais. Os serviços são prestados pelas próprias empresas, que respondem por preços, prazos e qualidade.</p>
          <p>Ao avaliar, você declara que a avaliação é verdadeira e baseada na sua experiência. Avaliações ofensivas, falsas ou com dados pessoais podem ser removidas.</p>
        </Section>
        <Section title="Política de privacidade (LGPD)">
          <p><strong>Dados coletados:</strong> nome, e-mail, senha (armazenada de forma criptografada), telefone opcional, cidade, favoritos, pedidos e avaliações.</p>
          <p><strong>Finalidade:</strong> criar sua conta, enviar seus pedidos às empresas escolhidas e exibir suas avaliações.</p>
          <p><strong>Compartilhamento:</strong> seus dados de contato só são enviados à empresa com a qual você fizer um pedido. Não vendemos dados pessoais.</p>
          <p><strong>Localização:</strong> a localização do aparelho só é usada com sua permissão, enquanto o app está aberto, e não é armazenada.</p>
          <p><strong>Seus direitos:</strong> você pode acessar, corrigir e excluir seus dados a qualquer momento em Perfil → Privacidade e dados. Veja também <a href="/excluir-conta" className="font-semibold text-brand-fg underline">como excluir sua conta</a>.</p>
          <p><strong>Contato:</strong> {BRAND.supportEmail}</p>
        </Section>
      </div>
    </div>
  );
}

/** Página pública exigida pela Google Play: explica como excluir a conta e os dados. */
export function DeleteAccountInfoPage() {
  return (
    <div>
      <PageHeader title="Excluir conta e dados" />
      <div className="container-app max-w-3xl space-y-4 py-5">
        <Section title={`Como excluir sua conta do ${BRAND.name}`}>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Abra o app ou o site e entre na sua conta.</li>
            <li>Toque em <strong>Perfil</strong> → <strong>Privacidade e dados</strong>.</li>
            <li>Toque em <strong>Excluir minha conta</strong> e confirme com sua senha.</li>
          </ol>
          <ButtonLink to="/perfil/privacidade" className="mt-2">Ir para Privacidade e dados</ButtonLink>
          <p>Sem acesso à conta? Envie um e-mail para <strong>{BRAND.supportEmail}</strong> a partir do endereço cadastrado, com o assunto “Excluir conta”. Respondemos em até 15 dias.</p>
        </Section>
        <Section title="O que é apagado">
          <ul className="list-disc space-y-1 pl-5">
            <li>Nome, e-mail, telefone, senha e cidade salva.</li>
            <li>Favoritos, agendamentos, pedidos de orçamento e avaliações feitas por você.</li>
            <li>Sessões abertas em todos os aparelhos.</li>
          </ul>
          <p>A exclusão é imediata e definitiva. Cópias de segurança do banco são sobrescritas em até 30 dias.</p>
        </Section>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState icon={<Compass className="h-8 w-8" />} title="Página não encontrada" action={<ButtonLink to="/">Ir para o início</ButtonLink>}>
      O endereço pode estar errado ou a página foi removida.
    </EmptyState>
  );
}
