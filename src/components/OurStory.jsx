import Divider from "./Divider";

export default function OurStory({ texto }) {
  return (
    <section className="px-6 sm:px-10 py-16 max-w-2xl mx-auto">
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4 text-center">
        Cómo empezó todo
      </p>
      <h2 className="font-display text-3xl text-center mb-6 text-gold-dark">Nuestra historia</h2>
      <div className="flex justify-center mb-8">
        <Divider />
      </div>
      <p className="font-body text-ink-light leading-relaxed text-center sm:text-left">{texto}</p>
    </section>
  );
}
