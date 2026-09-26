export default function ParentsInvitation({ padres }) {
  if (!padres) return null;
  return (
    <div className="mt-5 mb-2">
      <p className="font-body text-xs text-ink/60 italic mb-2">{padres.texto}</p>
      <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark/80 leading-relaxed">
        {padres.el.padre} &amp; {padres.el.madre}
        <br />
        {padres.ella.padre} &amp; {padres.ella.madre}
      </p>
    </div>
  );
}
