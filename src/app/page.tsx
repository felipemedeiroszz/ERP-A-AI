import Link from "next/link";
import { getCompanySettings, getStoreSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { ShoppingCart, Phone, Clock, MapPin, Star, Award, Zap } from "lucide-react";
import { ProductModal } from "@/components/store/product-modal";
import { CartDrawer } from "@/components/store/cart-drawer";
import { StoreClient } from "@/components/store/store-client";

export default async function HomePage() {
  const company = await getCompanySettings();
  const store = await getStoreSettings();

  const activeCategories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    include: {
      products: {
        where: { active: true },
        include: { addons: { include: { addon: true } } },
      },
    },
  });

  const weightPricePerKg = Number(store.weightPricePerKg || 59.9);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-purple-50 pb-28">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {company.fantasyName || company.name || "Açaiteria"}
                </h1>
                <div className="flex items-center gap-2">
                  {store.isOpen ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Aberto agora
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      Fechado
                    </span>
                  )}
                  {store.openTime && store.closeTime && (
                    <span className="text-xs text-gray-500">
                      {store.openTime} - {store.closeTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="relative px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <Star className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium">O melhor da região</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Monte seu açaí
                  <span className="block text-purple-200">como quiser!</span>
                </h2>
                
                <p className="text-lg text-purple-100 max-w-xl">
                  Delivery rápido ou retirada na loja. Açaí por peso ou copo pronto 
                  com os melhores adicionais. Qualidade premium em cada colher.
                </p>

                <div className="flex flex-wrap gap-4">
                  <a
                    href="#cardapio"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <ShoppingCart size={20} />
                    Ver Cardápio
                  </a>
                  {company.whatsapp && (
                    <a
                      href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Phone size={20} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition">
                  <div className="text-4xl mb-3">🥣</div>
                  <h3 className="font-semibold mb-1">Açaí Premium</h3>
                  <p className="text-sm text-purple-200">Por peso ou copo</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition">
                  <div className="text-4xl mb-3">🚚</div>
                  <h3 className="font-semibold mb-1">Delivery Express</h3>
                  <p className="text-sm text-purple-200">Chega rápido</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition">
                  <div className="text-4xl mb-3">🏪</div>
                  <h3 className="font-semibold mb-1">Retirada</h3>
                  <p className="text-sm text-purple-200">Sem espera</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition">
                  <div className="text-4xl mb-3">💳</div>
                  <h3 className="font-semibold mb-1">Pagamento Fácil</h3>
                  <p className="text-sm text-purple-200">PIX e dinheiro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Preparação Rápida</h3>
            <p className="text-sm text-gray-600">Seu pedido pronto em tempo recorde com nossa equipe especializada.</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Qualidade Premium</h3>
            <p className="text-sm text-gray-600">Ingredientes selecionados e preparo artesanal em cada pedido.</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Horário Flexível</h3>
            <p className="text-sm text-gray-600">Aberto todos os dias com delivery e retirada disponíveis.</p>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="cardapio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Nosso Cardápio</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore nossa seleção de açaís, combinações especiais e adicionais para criar 
            o pedido perfeito para você.
          </p>
        </div>
        
        {activeCategories.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cardápio em preparação</h3>
            <p className="text-gray-600">Estamos atualizando nossos produtos. Volte em breve!</p>
          </div>
        ) : (
          <StoreClient
            categories={JSON.parse(
              JSON.stringify(
                activeCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  products: c.products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    price: Number(p.price),
                    image: p.image,
                    isWeightBased: p.isWeightBased,
                    addons: p.addons.map((pa) => ({
                      id: pa.addon.id,
                      name: pa.addon.name,
                      price: Number(pa.addon.price),
                    })),
                  })),
                }))
              )
            )}
            weightPricePerKg={weightPricePerKg}
          />
        )}
      </section>

      {/* Location & Contact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-3xl p-8 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Localização</h3>
              <div className="space-y-3">
                {company.street && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {company.street}, {company.number}
                        {company.complement && ` - ${company.complement}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {company.neighborhood} - {company.city}/{company.state}
                      </p>
                      <p className="text-sm text-gray-600">CEP: {company.zipCode}</p>
                    </div>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{company.phone}</p>
                      <p className="text-sm text-gray-600">Ligue para fazer seu pedido</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Horário de Funcionamento</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Segunda a Sexta</span>
                  <span className="font-medium text-gray-900">
                    {store.openTime || '10:00'} - {store.closeTime || '22:00'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Sábado</span>
                  <span className="font-medium text-gray-900">
                    {store.openTime || '10:00'} - {store.closeTime || '22:00'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Domingo</span>
                  <span className="font-medium text-gray-900">
                    {store.openTime || '10:00'} - {store.closeTime || '22:00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span className="font-bold text-gray-900">
                  {company.fantasyName || company.name}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Qualidade e sabor em cada colher. A melhor experiência em açaí da região.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Informações</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Sobre nós</li>
                <li>Cardápio</li>
                <li>Como pedir</li>
                <li>Política de entrega</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {company.phone && <li>Telefone: {company.phone}</li>}
                {company.whatsapp && <li>WhatsApp: {company.whatsapp}</li>}
                {company.email && <li>Email: {company.email}</li>}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {company.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <CartDrawer deliveryFee={Number(store.deliveryFee || 0)} />
    </main>
  );
}
