// Bricx's single-open accordion: reversible CSS grid transitions, themed locally.
const disclosures = [...document.querySelectorAll('#faq .faq-item')];
const cards = disclosures.map((details, index) => {
  const summary = details.querySelector('summary');
  const card = document.createElement('article');
  card.className = details.className;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'faq-question';
  trigger.id = 'faq-question-' + index;
  trigger.append(...summary.childNodes);
  const answer = document.createElement('div');
  answer.className = 'faq-answer';
  answer.id = 'faq-answer-' + index;
  answer.setAttribute('aria-labelledby', trigger.id);
  trigger.setAttribute('aria-controls', answer.id);
  const inner = document.createElement('div');
  inner.className = 'faq-answer-inner';
  inner.append(...[...details.childNodes].filter(node => node !== summary));
  answer.append(inner);
  card.append(trigger, answer);
  const setOpen = open => {
    card.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    answer.setAttribute('aria-hidden', String(!open));
    answer.inert = !open;
  };
  setOpen(details.open);
  details.replaceWith(card);
  return { trigger, setOpen };
});
for (const card of cards) {
  card.trigger.addEventListener('click', () => {
    const opening = card.trigger.getAttribute('aria-expanded') !== 'true';
    cards.forEach(other => other.setOpen(other === card && opening));
  });
}
