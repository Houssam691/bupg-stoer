export default function Home() {
  return (
    <div className="grid gap-6">
      <section className="glass glass-hover rounded-3xl p-6 md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/80">
          متجر حسابات الألعاب • شحن • تسليم سريع
        </div>
        <h1 className="title mt-6">متجر الألعاب</h1>
        <p className="subtitle max-w-2xl">
          اختر القسم الذي تريده. ستجد منتجات جاهزة للعرض ويمكن للآدمن إدارتها من لوحة التحكم.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn-primary" href="/pubg">
            حسابات PUBG Mobile
          </a>
          <a className="btn-secondary" href="/free-fire">
            حسابات Free Fire
          </a>
          <a className="btn-secondary" href="/topup">
            خدمات الشحن (Top-up)
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <a className="glass glass-hover rounded-3xl p-6" href="/pubg">
          <div className="text-sm font-bold text-white/70">PUBG</div>
          <div className="mt-2 text-xl font-black">حسابات ببجي</div>
          <div className="mt-2 text-sm leading-7 text-white/70">عروض حسابات، سكنات، مستويات.</div>
        </a>
        <a className="glass glass-hover rounded-3xl p-6" href="/free-fire">
          <div className="text-sm font-bold text-white/70">Free Fire</div>
          <div className="mt-2 text-xl font-black">حسابات فري فاير</div>
          <div className="mt-2 text-sm leading-7 text-white/70">حسابات نادرة وعروض مميزة.</div>
        </a>
        <a className="glass glass-hover rounded-3xl p-6" href="/topup">
          <div className="text-sm font-bold text-white/70">Top-up</div>
          <div className="mt-2 text-xl font-black">خدمات الشحن</div>
          <div className="mt-2 text-sm leading-7 text-white/70">شحن شدات/جواهر/عملات بسرعة.</div>
        </a>
      </section>
    </div>
  );
}
