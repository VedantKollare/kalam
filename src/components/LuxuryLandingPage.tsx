import { ArrowRight, Heart, Menu, Search, ShoppingBag, Sparkles } from 'lucide-react';

const categories = [
  {
    title: 'Designer Blouses',
    description: 'Hand-finished silhouettes with sculpted collars and luxe detailing.',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Bespoke Gowns',
    description: 'Made-to-measure statement pieces for soirées and grand occasions.',
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Indo-Western Dresses',
    description: 'Modern drape and rich craftsmanship for evening dressing.',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
];

const products = [
  {
    title: 'Sculpted Ivory Blouse',
    tags: ['Ready to Ship', 'Custom Fit Available'],
    price: '₹7,800',
    image:
      'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Champagne Silk Gown',
    tags: ['Limited Edition', 'Bespoke'],
    price: '₹18,500',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Embroidered Fusion Dress',
    tags: ['New Arrival', 'Ready to Ship'],
    price: '₹12,400',
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Moonlit Cape Blouse',
    tags: ['Custom Fit Available', 'Premium'],
    price: '₹9,200',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
];

export default function LuxuryLandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-[#f7f1e8] text-[#2e2a25]">
      <header className="sticky top-0 z-50 border-b border-[#e6dccb] bg-[#f7f1e8]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfa96d] bg-[#fffaf2] text-sm font-semibold tracking-[0.3em] text-[#8b6a3f]">
              OC
            </div>
            <div>
              <p className="font-serif text-xl font-semibold tracking-[0.2em] text-[#2e2a25]">Om Creations</p>
              <p className="text-xs uppercase tracking-[0.35em] text-[#8b6a3f]">Luxury Fashion House</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-[#4d463f] lg:flex">
            <a href="#collections" className="transition hover:text-[#8b6a3f]">Collections</a>
            <a href="#blouses" className="transition hover:text-[#8b6a3f]">Blouses</a>
            <a href="#dresses" className="transition hover:text-[#8b6a3f]">Dresses</a>
            <a href="#custom" className="transition hover:text-[#8b6a3f]">Custom Couture</a>
            <a href="#about" className="transition hover:text-[#8b6a3f]">About</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="hidden items-center gap-2 rounded-full border border-[#e2d4bb] bg-white/70 px-3 py-2 text-sm text-[#7a6b54] sm:flex">
              <Search size={16} />
              <input aria-label="Search products" className="w-24 bg-transparent outline-none" placeholder="Search" />
            </label>
            <button className="rounded-full border border-[#e2d4bb] bg-white/70 p-2.5 text-[#4d463f] transition hover:border-[#cfa96d] hover:text-[#8b6a3f]" aria-label="Wishlist">
              <Heart size={18} />
            </button>
            <button className="rounded-full border border-[#e2d4bb] bg-[#2e2a25] p-2.5 text-[#f8f3ea] transition hover:bg-[#8b6a3f]" aria-label="Cart">
              <ShoppingBag size={18} />
            </button>
            <button className="rounded-full border border-[#e2d4bb] p-2.5 text-[#4d463f] lg:hidden" aria-label="Open menu">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-12">
          <div className="flex flex-col justify-center rounded-[2rem] border border-[#e6dccb] bg-[#fffaf2] p-6 shadow-[0_20px_60px_rgba(46,42,37,0.08)] sm:p-8 lg:p-12">
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-[#eadcbe] bg-[#f7edd6] px-3 py-1 text-sm text-[#8b6a3f]">
              <Sparkles size={15} />
              New collection • Winter 2026
            </div>
            <h1 className="max-w-xl font-serif text-4xl leading-tight text-[#1e1b18] sm:text-5xl lg:text-6xl">
              Sculptural elegance for every unforgettable moment.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#645c53] sm:text-lg">
              Discover couture-inspired blouses, bespoke gowns, and refined fusion silhouettes crafted for discerning wardrobes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#collections" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2e2a25] px-6 py-3 text-sm font-semibold text-[#f9f4eb] transition hover:bg-[#8b6a3f]">
                Explore Collections <ArrowRight size={16} />
              </a>
              <a href="#custom" className="inline-flex items-center justify-center rounded-full border border-[#d8c7a2] bg-white/70 px-6 py-3 text-sm font-semibold text-[#4d463f] transition hover:border-[#cfa96d] hover:text-[#8b6a3f]">
                Book a Consultation
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#e6dccb] bg-[#efe4ce] shadow-[0_20px_60px_rgba(46,42,37,0.08)]">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80"
              alt="Luxury fashion model wearing a designer blouse"
              className="h-full min-h-[360px] w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
        </section>

        <section id="collections" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8b6a3f]">Curated collections</p>
              <h2 className="font-serif text-3xl text-[#1e1b18] sm:text-4xl">Signature categories</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <article key={category.title} className="group overflow-hidden rounded-[1.5rem] border border-[#e6dccb] bg-[#fffaf2] shadow-sm">
                <img src={category.image} alt={category.title} className="h-64 w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-[#1e1b18]">{category.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6f685f]">{category.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="blouses" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8b6a3f]">Featured edit</p>
              <h2 className="font-serif text-3xl text-[#1e1b18] sm:text-4xl">Designer essentials</h2>
            </div>
            <a href="#custom" className="text-sm font-semibold text-[#8b6a3f] transition hover:text-[#2e2a25]">
              Request a bespoke fitting →
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.title} className="group overflow-hidden rounded-[1.5rem] border border-[#e6dccb] bg-[#fffaf2] shadow-sm">
                <div className="overflow-hidden">
                  <img src={product.image} alt={product.title} className="h-72 w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-[#e8dbc0] bg-[#f7edd6] px-2.5 py-1 text-[11px] uppercase tracking-[0.25em] text-[#8b6a3f]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 font-serif text-xl text-[#1e1b18]">{product.title}</h3>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-base font-semibold text-[#2e2a25]">{product.price}</p>
                    <button className="rounded-full border border-[#d8c7a2] bg-white/80 px-3 py-2 text-sm font-semibold text-[#4d463f] transition hover:border-[#cfa96d] hover:text-[#8b6a3f]">
                      Quick Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="custom" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[#e6dccb] bg-[#2e2a25] p-8 text-[#f8f3ea] shadow-[0_25px_80px_rgba(46,42,37,0.15)] sm:p-10 lg:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.35em] text-[#d9b67d]">Private styling</p>
                <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Book a virtual consultation with our design concierge.</h2>
                <p className="mt-4 text-base leading-8 text-[#e7d8c2]">
                  Connect over WhatsApp or Zoom for bespoke guidance, color matching, and silhouette refinement from the comfort of your home.
                </p>
              </div>
              <a href="#" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5d7a0] px-6 py-3 text-sm font-semibold text-[#2e2a25] transition hover:bg-[#e8c06a]">
                Schedule a Call <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6dccb] bg-[#f3ebdc]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="font-serif text-2xl text-[#1e1b18]">Om Creations</p>
            <p className="mt-3 text-sm leading-7 text-[#6f685f]">Elevated craftsmanship for contemporary Indian luxury dressing.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8b6a3f]">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#5e584f]">
              <li><a href="#collections" className="hover:text-[#2e2a25]">Collections</a></li>
              <li><a href="#blouses" className="hover:text-[#2e2a25]">Blouses</a></li>
              <li><a href="#custom" className="hover:text-[#2e2a25]">Consultation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8b6a3f]">Policies</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#5e584f]">
              <li><a href="#" className="hover:text-[#2e2a25]">Shipping</a></li>
              <li><a href="#" className="hover:text-[#2e2a25]">Returns</a></li>
              <li><a href="#" className="hover:text-[#2e2a25]">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8b6a3f]">Stay in touch</h3>
            <p className="mt-4 text-sm leading-7 text-[#5e584f]">Join the private list for previews and launches.</p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-[#e2d4bb] bg-white/70 px-3 py-2">
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Email address" />
              <button className="rounded-full bg-[#2e2a25] px-3 py-1.5 text-sm text-[#f9f4eb]">Join</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
