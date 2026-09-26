import Divider from "./Divider";

export default function FinalScreen({ novios }) {
  return (
    <section className="relative px-6 py-24 text-center overflow-hidden">
      <p className="font-body text-ink/60 mb-4">Los esperamos.</p>
      <h2 className="font-script text-5xl mb-4 text-gold-dark">
        {novios.el} & {novios.ella}
      </h2>
      <Divider />
      <p className="mt-4 font-body text-ink/60 text-sm">Con todo nuestro cariño.</p>
    </section>
  );
}
